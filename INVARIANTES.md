# INVARIANTES

Regras que nenhum código pode violar, seja escrito por pessoa ou por
agente. Cada linha tem o capítulo que a criou e o teste que a prova.

## Segurança de acesso

- **SEC-01** Toda rota declara política como primeiro middleware ou
  dependência; pública só se estiver em `PUBLICAS`.
  *Cap. 2 · prova: teste do censo.*
- **SEC-02** Resposta de erro só sai do tradutor de erros: nunca pilha,
  caminho de arquivo ou mensagem interna. Erro desconhecido vira 500
  genérico. *Cap. 2 · prova: ATQ-01.10.*
- **SEC-03** O mapa da API (`/docs`, `/openapi.json`) fica fechado fora
  do ambiente de desenvolvimento. *Cap. 2 · prova: teste do pipeline.*
