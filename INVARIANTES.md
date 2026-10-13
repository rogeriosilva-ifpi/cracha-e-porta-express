# INVARIANTES

Regras que nenhum código pode violar, seja escrito por pessoa ou por
agente. Cada linha tem o capítulo que a criou e o teste que a prova.

## Segurança de acesso

- **SEC-01** Todo segredo, token ou código gerado vem de gerador
  criptográfico (`randomBytes`, `secrets`), nunca de `Math.random` ou
  `random`. Segredos são comparados em tempo constante
  (`timingSafeEqual`, `hmac.compare_digest`). Base64 não é proteção.
  *Cap. 2 · prova: revisão com grep do prompts/cap02.md.*
- **SEC-02** Toda rota declara política como primeiro middleware ou
  dependência; pública só se estiver em `PUBLICAS`.
  *Cap. 3 · prova: teste do censo.*
- **SEC-03** Resposta de erro só sai do tradutor de erros: nunca pilha,
  caminho de arquivo ou mensagem interna. Erro desconhecido vira 500
  genérico. *Cap. 3 · prova: ATQ-01.10.*
- **SEC-04** O mapa da API (`/docs`, `/openapi.json`) fica fechado fora
  do ambiente de desenvolvimento. *Cap. 3 · prova: teste do pipeline.*
