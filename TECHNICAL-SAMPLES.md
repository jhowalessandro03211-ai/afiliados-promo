# Amostras técnicas — v0.14.0

> Trechos sanitizados do núcleo real do Afiliados Promo. O repositório de portfólio não publica o backend de produção completo nem credenciais.

## Scoring e diversidade

```js
function afpAutopilotTitleTokens(item) {
  const stop=new Set(["para","com","sem","uma","kit","oferta","promoção","promocao","produto","de","da","do","das","dos","em","e","a","o","as","os"]);
  return new Set(String(item?.title||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").split(/\s+/).filter(x=>x.length>=4&&!stop.has(x)));
}
function afpAutopilotSimilarity(a,b) {
  const A=afpAutopilotTitleTokens(a),B=afpAutopilotTitleTokens(b);
  if(!A.size||!B.size)return 0;
  let inter=0;for(const x of A)if(B.has(x))inter++;
  return inter/(A.size+B.size-inter);
}
function afpAutopilotSelectionScore(item,cfg,q) {
  let value=Number(item.score)||0;
  if(cfg.selectionIntelligence===false) return value;
  const window=Math.max(1,Math.min(20,Number(cfg.diversityWindow)||6));
  const recent=q.filter(x=>x.status==="published").sort((a,b)=>Date.parse(b.finishedAt||b.queuedAt||0)-Date.parse(a.finishedAt||a.queuedAt||0)).slice(0,window);
  const keyword=String(item.keyword||"").trim().toLowerCase();
  if(keyword&&recent.some(x=>String(x.keyword||"").trim().toLowerCase()===keyword)) value-=Math.max(0,Number(cfg.diversityPenaltyKeyword)||10);
  const threshold=Math.max(.15,Math.min(.9,Number(cfg.similarityThreshold)||.42));
  const maxSim=recent.reduce((m,x)=>Math.max(m,afpAutopilotSimilarity(item,x)),0);
  if(maxSim>=threshold) value-=Math.max(0,Number(cfg.diversityPenaltySimilar)||25);
  const ageHours=Math.max(0,(Date.now()-Date.parse(item.queuedAt||Date.now()))/3600000);
  value+=Math.min(12,ageHours);
  return Math.round(value*10)/10;
}
```

## Identidade e deduplicação

```js
function afpAutopilotTitleKey(item) {
  const title=String(item?.title||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  const normalized=title.replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g," ");
  return normalized ? crypto.createHash("sha256").update(`title:${normalized}`).digest("hex").slice(0,24) : "";
}
function afpAutopilotFingerprint(item) {
  const store=String(item?.store||"").trim().toLowerCase();
  let stableId="";
  if(item?.itemId){
    stableId = store==="mercadolivre" ? `mercadolivre:${String(item.itemId)}` : `shopee:${String(item.shopId||"")}:${String(item.itemId)}`;
  }
  const source = stableId || String(item.url||item.affiliateUrl||item.title||"");
  return crypto.createHash("sha256").update(source).digest("hex").slice(0,24);
}
function afpAutopilotSameIdentity(a,b) {
  if(!a||!b) return false;
  const afp=a.fingerprint||afpAutopilotFingerprint(a), bfp=b.fingerprint||afpAutopilotFingerprint(b);
  if(afp&&bfp&&afp===bfp) return true;
  if(a.itemId&&b.itemId&&String(a.itemId)===String(b.itemId) && (!a.shopId||!b.shopId||String(a.shopId)===String(b.shopId))) return true;
  const at=a.titleKey||afpAutopilotTitleKey(a), bt=b.titleKey||afpAutopilotTitleKey(b);
  return Boolean(at&&bt&&at===bt);
}
```

## Resgate persistente de saturação

O coletor mantém um banco separado de termos long-tail. Quando há itens elegíveis, nenhuma novidade entra na fila e ainda existe capacidade, o sistema considera o universo atual saturado. O resgate começa novamente na página 1, alterna ordenação/listagem e avança um cursor persistente.

```js
const saturated =
  cfg.autoEnqueue &&
  queued===0 &&
  eligible.length>0 &&
  activeQueueCount()<maxQueueSize &&
  cfg.adaptiveExpansion!==false;

if (saturated) {
  const bank=(Array.isArray(cfg.rescueKeywords)
    ? cfg.rescueKeywords
    : AFP_COLLECTOR_DEFAULTS.rescueKeywords)
    .map(x=>String(x).trim()).filter(Boolean);

  const perRun=Math.max(1,Math.min(12,Number(cfg.rescueKeywordsPerRun)||6));
  const pages=Math.max(1,Math.min(10,Number(cfg.rescuePagesPerKeyword)||4));

  if (bank.length) {
    const start=saturationState.cursor%bank.length;
    for(let i=0;i<Math.min(perRun,bank.length);i++) {
      rescueKeywordsUsed.push(bank[(start+i)%bank.length]);
    }

    rescue: for(let page=1;page<=pages;page++) {
      for(let ki=0;ki<rescueKeywordsUsed.length;ki++) {
        if(expansionRequests>=expansionMaxRequests) break rescue;

        const keyword=rescueKeywordsUsed[ki];
        const result=await afpShopeeSearchKeyword(keyword,cfg,{
          page,
          sortType: sortTypes[(slot+requests+expansionRequests+ki+page)%sortTypes.length],
          listType: listTypes[(slot+expansionRequests+ki+page)%listTypes.length]
        });

        const fresh=[];
        for(const p of result.nodes) {
          const item=afpCollectorNormalizeProduct(p,keyword);
          const fp=item.fingerprint||afpAutopilotFingerprint(item);
          if(seenFp.has(fp)) continue;
          seenFp.add(fp);
          unique.push(item);
          fresh.push(item);
        }

        const freshEligible=eligibleFrom(fresh);
        if(freshEligible.length) {
          eligible.push(...freshEligible);
          eligible.sort((a,b)=>b.score-a.score);
          queued+=afpCollectorQueueItems(freshEligible);
          if(activeQueueCount()>=maxQueueSize) break rescue;
        }
      }
    }

    saturationState.cursor=(start+Math.min(perRun,bank.length))%bank.length;
  }

  saturationState.zeroQueueStreak=queued===0
    ? saturationState.zeroQueueStreak+1
    : 0;

  afpCollectorWriteSaturationState(saturationState);
}
```

### Propriedades preservadas pelo resgate

- não reduz o `minScore`;
- não desativa dedupe;
- não repete fingerprints conhecidos;
- limita requisições de expansão;
- persiste cursor e sequência de execuções sem fila;
- para quando a fila atinge a capacidade configurada.

## Observação

Os trechos acima foram extraídos da versão de produção e reduzidos para revisão. Funções auxiliares, endpoints, segredos, caminhos internos e detalhes operacionais foram omitidos propositalmente.
