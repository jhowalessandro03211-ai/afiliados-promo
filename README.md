# Afiliados Promo — Portfolio Técnico

Sistema de automação para coleta, seleção e publicação de ofertas de afiliados. Este repositório apresenta uma **versão sanitizada e selecionada para revisão técnica** da v0.14.0: não contém credenciais, tokens, dados de produção, estado persistente nem o backend proprietário completo.

## Visão geral

O projeto organiza o fluxo de afiliados em um backend Node.js/Express com painel administrativo privado, persistência local e integrações externas. A automação foi construída de forma iterativa, com foco em resiliência operacional, deduplicação e recuperação de cenários em que a fonte de produtos começa a retornar itens repetidos.

Fluxo principal:

`Coletor -> scoring/filtros -> fila -> Autopilot -> publicação -> histórico/dedupe`

## Principais recursos

- **Autopilot de publicações** com janelas de horário, limite diário, pacing e fila persistente.
- **Shopee Affiliate Open API** com coleta por palavras-chave, rotação de ordenação/lista e geração de candidatos.
- **Anti-saturação persistente** com banco rotativo de buscas de resgate, páginas iniciais e cursor persistente.
- **Seleção inteligente** com score mínimo, penalidades de similaridade e diversidade.
- **Deduplicação** por fingerprint estável, identidade do item e chave normalizada do título.
- **Telegram resiliente** com imagem, fallback para texto e retry controlado.
- **Mercado Livre** com OAuth e coletor experimental.
- **Licenciamento** com ativação, validação e vínculo de instalação.
- **Painel OWNER** privado para operação e diagnóstico.
- **Persistência fora do código**, adequada a deploy com PM2/Nginx.

## Arquitetura

```text
Afiliados Promo
├── API Express
│   ├── licença / ativação
│   ├── promoções
│   ├── Autopilot
│   ├── coletor Shopee
│   └── Mercado Livre OAuth/coletor
├── Engine de seleção
│   ├── scoring
│   ├── diversidade
│   ├── fingerprint/title key
│   └── dedupe temporal
├── Persistência JSON
│   ├── configuração
│   ├── fila
│   ├── histórico
│   └── estado anti-saturação
├── Publicador Telegram
└── Painel administrativo privado
```

## Stack

Node.js (ES Modules), Express, JavaScript, REST/JSON, OAuth 2.0, Telegram Bot API, Shopee Affiliate Open API, Mercado Livre APIs, PM2 e Nginx/HTTPS.

## O que foi publicado aqui

Por segurança e para não abrir todo o código proprietário de produção, este portfólio contém:

```text
README.md
SECURITY.md
TECHNICAL-SAMPLES.md          # trechos reais sanitizados do núcleo
backend/
├── .env.example              # somente nomes de variáveis
├── .gitignore
├── deploy/
│   └── nginx-afiliados-promos.conf
├── ecosystem.config.cjs
├── package.json
├── reset-license-binding.js
└── reset-license-state.js
```

O arquivo **TECHNICAL-SAMPLES.md** mostra partes reais da lógica de scoring/diversidade, identidade/deduplicação e do mecanismo anti-saturação persistente da v0.14.0.

## Segurança e operação

Configuração sensível fica fora do código através de variáveis de ambiente. O `.env` real, tokens, chaves, dados persistentes, OAuth, backups, logs, dados de clientes e detalhes privados do servidor não fazem parte deste repositório.

## Caso técnico: saturação do coletor

Um problema observado em operação era a fila parar de receber novidades mesmo com a API da Shopee respondendo. A causa não era indisponibilidade da API: a coleta voltava a encontrar produtos já conhecidos pelo dedupe.

Na v0.14.0 foi implementado um mecanismo de resgate persistente. Quando ocorre saturação, ele seleciona um conjunto rotativo de termos long-tail, reinicia a busca nas páginas iniciais, varia os modos de ordenação/listagem e persiste um cursor para que execuções futuras explorem outras categorias. O mecanismo mantém o score mínimo e as regras de deduplicação.

## Estado das integrações nesta versão

| Integração | Estado na v0.14.0 |
|---|---|
| Shopee | Implementada e integrada ao Autopilot |
| Telegram | Implementado como canal de publicação |
| Mercado Livre OAuth | Implementado |
| Mercado Livre coleta | Experimental/limitada pelo link de afiliado |
| AliExpress | Reconhecimento/validação; API completa não incluída |
| WhatsApp | Não incluído nesta versão |

## Sobre o desenvolvimento

O projeto foi desenvolvido de forma iterativa com assistência de IA, usada como ferramenta de engenharia para geração/revisão de código, diagnóstico, testes e documentação. As decisões de produto, validação em ambiente real e evolução dos fluxos foram conduzidas durante ciclos sucessivos de teste e correção.

## Aviso

Repositório destinado a **avaliação técnica/portfólio**. O código proprietário completo permanece privado.
