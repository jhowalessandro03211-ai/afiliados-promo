# Afiliados Promo — Portfolio Técnico

Sistema de automação para coleta, seleção e publicação de ofertas de afiliados. Este repositório é uma **versão sanitizada para revisão técnica** da v0.14.0: não contém credenciais, tokens, dados de produção nem estado persistente do servidor.

## Visão geral

O projeto organiza o fluxo de afiliados em um backend Node.js/Express com painel administrativo privado, persistência local e integrações externas. A automação foi construída de forma iterativa, com foco em resiliência operacional, deduplicação e recuperação de cenários em que a fonte de produtos começa a retornar itens repetidos.

Fluxo principal:

`Coletor -> scoring/filtros -> fila -> Autopilot -> publicação -> histórico/dedupe`

## Principais recursos

- **Autopilot de publicações** com janelas de horário, limite diário, pacing e fila persistente.
- **Shopee Affiliate Open API** com coleta por palavras-chave, rotação de ordenação/lista e geração de candidatos.
- **Anti-saturação persistente**: quando a coleta encontra ofertas elegíveis mas nenhuma novidade entra na fila, o sistema rotaciona um banco de buscas de resgate, começa novamente pelas primeiras páginas e persiste cursor/streak entre execuções.
- **Seleção inteligente** com score mínimo, penalidades de similaridade e diversidade de palavras-chave.
- **Deduplicação** por fingerprint estável, identidade do item e chave normalizada do título.
- **Telegram resiliente** com envio de imagem, fallback para texto e retry controlado.
- **Mercado Livre** com OAuth e coletor experimental baseado em catálogo/listagens; a geração automática do link de afiliado permanece uma limitação conhecida desta versão.
- **Licenciamento** com ativação, validação, vínculo de instalação e administração privada.
- **Painel OWNER** protegido no backend para operação e diagnóstico.
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

- Node.js (ES Modules)
- Express
- JavaScript
- REST/JSON
- OAuth 2.0
- Telegram Bot API
- Shopee Affiliate Open API
- Mercado Livre APIs
- PM2
- Nginx + HTTPS em produção

## Segurança e operação

O projeto separa configuração sensível do código através de variáveis de ambiente. O arquivo `.env` não faz parte do repositório. O painel administrativo usa uma chave própria e pode exigir HTTPS/acesso OWNER. Dados persistentes podem ser mantidos fora do diretório da aplicação, evitando perda durante deploys.

Há também validações de URLs de afiliado por plataforma e proteções no tratamento de URLs de imagem.

## Rodando localmente

Requisitos: Node.js 18+.

```bash
cd backend
cp .env.example .env
npm install
npm start
```

Para um teste local mínimo, preencha apenas as variáveis necessárias ao recurso que deseja testar. Integrações externas exigem credenciais próprias; **nenhuma credencial real acompanha este repositório**.

Health check:

```text
GET /healthz
```

## Estrutura relevante

```text
backend/
├── server.js                    # API, Autopilot, coletores e integrações
├── private-admin/               # painel OWNER
├── deploy/                      # exemplo de proxy Nginx
├── ecosystem.config.cjs         # PM2
├── .env.example                 # nomes das configurações, sem segredos
└── package.json
```

## Caso técnico: saturação do coletor

Um problema observado em operação era a fila parar de receber novidades mesmo com a API da Shopee respondendo. A causa não era indisponibilidade da API: a coleta voltava a encontrar produtos já conhecidos pelo dedupe.

Na v0.14.0 foi implementado um mecanismo de resgate persistente. Quando ocorre saturação, ele seleciona um conjunto rotativo de termos long-tail, reinicia a busca nas páginas iniciais, varia os modos de ordenação/listagem e persiste um cursor para que execuções futuras explorem outras categorias. O mecanismo mantém o score mínimo e as regras de deduplicação em vez de resolver o problema reduzindo a qualidade dos filtros.

## Estado das integrações nesta versão

| Integração | Estado na v0.14.0 |
|---|---|
| Shopee | Implementada no backend e integrada ao Autopilot |
| Telegram | Implementado como canal de publicação |
| Mercado Livre OAuth | Implementado |
| Mercado Livre coleta | Experimental/limitada pela disponibilidade de dados e link de afiliado |
| AliExpress | Reconhecimento/validação presentes; integração completa de API não incluída nesta versão |
| WhatsApp | Não incluído nesta versão de portfólio |

## Sobre o desenvolvimento

O projeto foi desenvolvido de forma iterativa com assistência de IA, usada como ferramenta de engenharia para geração/revisão de código, diagnóstico, testes e documentação. As decisões de produto, validação em ambiente real e evolução dos fluxos foram conduzidas durante ciclos sucessivos de teste e correção.

## Aviso

Este repositório é destinado a **avaliação técnica/portfólio**. Credenciais, tokens, dados de clientes, estado de produção, backups e configurações privadas foram deliberadamente excluídos.
