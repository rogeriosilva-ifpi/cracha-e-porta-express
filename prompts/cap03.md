# Capítulo 3 · Onde a identidade viaja — prompts complementares

## Agente · versão FastAPI

```
Goal
GET /api/patients/{id}/encounters: lista os atendimentos de um paciente.

Context
@src/prontuario/atendimentos/ @src/prontuario/acesso/
@INVARIANTES.md @docs/PERMISSOES.md

Constraints
- dependencies=[Depends(exige("encounter:read"))]; nunca publica();
  sem permissão nova
- 404 via NotFoundError; sem bibliotecas novas
- fora de escopo: filtrar por profissional (capítulo 12)

Done when
- uv run pytest verde (censo incluído)
- uv run python scripts/censo.py: rota nova, 0 problemas
- teste novo: sem crachá 401; recepção 200
```

## Chat · C-P-T-R-F-A

```
C  Express 5 + TS. Colo abaixo politica.ts e src/atendimentos/rotas.ts.
P  Dev sênior de backend.
T  Escreva só o handler da rota GET /api/patients/:id/encounters.
R  Primeiro middleware exige("encounter:read"); erros só por throw das
   classes de erros.ts; sem bibliotecas novas.
F  Só o trecho app.get(...), comentado em português.
A  npm run censo sem problemas.
```

## Revisão · contexto novo

```
Revise src/app.ts e src/acesso/ contra INVARIANTES.md (SEC-02 a
SEC-04): ordem dos middlewares, rota fora do padrão de política, erro
que escapa do tradutor de erros. Para cada achado: arquivo:linha e um
curl que o demonstre. Não reescreva código.
```
