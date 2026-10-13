# AGENTS.md — Mini-Prontuário

Leia antes de qualquer tarefa: @INVARIANTES.md @docs/PERMISSOES.md

## Layout
Uma pasta por fatia (`pacientes/`, `atendimentos/`, `prescricoes/`,
`admin/`). Tudo de acesso mora em `acesso/`: política, permissões,
censo. Erros HTTP só em `http/erros`.

## Regras de acesso
- Rota nova SEMPRE recebe `exige("<permissao>")` como primeiro
  middleware (Express) ou em `dependencies=[...]` (FastAPI).
- Nunca use `publica()` sem pedir revisão humana: ela exige editar
  `PUBLICAS` no censo, e esse diff é revisado.
- Permissão nova: acrescente na `MATRIZ` e em docs/PERMISSOES.md no
  mesmo commit.
- `cracha-provisorio` é andaime. Não o estenda; ele morre no cap. 5.

## Portões (rode antes de declarar pronto)
- `npm run check` · `npm test` · `npm run censo`
- `python placar.py ataques.http` com o servidor no ar (`npm start`)
