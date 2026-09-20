# Segurança da versão de portfólio

Esta cópia foi preparada para revisão técnica.

Não devem ser commitados:
- `.env` ou arquivos equivalentes;
- tokens de Telegram, OAuth ou APIs de afiliados;
- chaves administrativas/licenças reais;
- arquivos persistentes de fila, histórico, dedupe ou OAuth;
- backups e logs de produção.

Use apenas `.env.example` como referência e credenciais próprias em ambiente local.
