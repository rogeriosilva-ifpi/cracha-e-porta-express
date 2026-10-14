# Capítulo 12 · IDOR, BOLA e o dono do objeto — prompts complementares

## Agente · versão Express

```
Goal
Escopo por objeto nos atendimentos e prescrições, regra de prescrição
no domínio e entrada/saída por lista de campos.

Context
@src/atendimentos/ @src/prescricoes/ @src/acesso/ @docs/PERMISSOES.md
@INVARIANTES.md · Express 5 + TS, Zod.

Constraints
- visiveis(u) e buscarVisivel(u, id): o que não vê é 404
- só o autor altera (403 para quem vê e não é autor)
- prescrever: buscarVisivel + abac() do cap. 10 com de_plantao;
  negado: evento com motivo, resposta sem motivo
- schemas .strict(); profissionalId e papel nunca do corpo
- saída: resumo sem motivo para quem não é autor; publico() em
  toda resposta com usuário

Done when
- npm test verde; placar 45/45; matriz.http 100%
```

## Chat · C-P-T-R-F-A

```
C  FastAPI + Pydantic 2. Colo prontuario/atendimentos/rotas.py.
P  Dev sênior de backend.
T  Torne a rota de prescrição segura contra BOLA e atribuição em massa.
R  Escopo antes de validar o corpo; extra="forbid"; quem prescreve
   vem da sessão; 404 para o que não é visível.
F  Só a rota, comentada em português.
A  tests/test_objeto.py passa.
```

## Revisão · contexto novo

```
Revise as rotas com :id contra INVARIANTES.md (SEC-30 a SEC-32).
Para cada rota: a busca está dentro do escopo de quem pede? Existe
"find por id" seguido de checagem? O corpo aceita campo que não devia
(dono, papel, autor)? A resposta devolve campo que quem pede não deve
ver? Para cada achado: arquivo:linha e um bloco .http com o id de
outro usuário.
```
