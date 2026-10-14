# prontuario-express

Laboratório do ebook **Crachá & Porta** — stack Express 5 + TypeScript.

Cada capítulo é uma tag: `git checkout cap01`, `git checkout cap02`…

```bash
npx tsx laboratorio/cripto.ts     # capítulo 2
npm install
npm start                 # :3000
npm run check             # tsc --noEmit
npm test                  # vitest + supertest
npm run censo             # rotas e políticas
python placar.py ataques.http
```

`prompts/` traz os prompts complementares de cada capítulo (variante
C-P-T-R-F-A e revisão). Leia na branch principal.

## Senhas de laboratório (a partir do capítulo 4)

| usuário | senha |
|---|---|
| admin@hospital.dev | farol-de-amarracao-2026 |
| ana@hospital.dev | cajueiro-em-flor-no-quintal |
| bruno@hospital.dev | barco-azul-no-delta |
| carla@hospital.dev | rede-na-varanda-de-tarde |

Só existem para o laboratório. O banco sobe em memória e é recriado a cada início.

`laboratorio/custo.ts` mede quanto custa um palpite de senha (capítulo 4).

## Tokens de API (capítulos 6 e 7)

```bash
python raiox.py --login http://localhost:3000 ana@hospital.dev cajueiro-em-flor-no-quintal
```

`POST /api/auth/token` devolve access (JWT EdDSA, 10 min) e refresh
(opaco, com rotação); `POST /api/auth/refresh` troca o refresh;
`POST /api/auth/logout-all` sai de todos os dispositivos; as chaves
públicas ficam em `/.well-known/jwks.json`. O `raiox.py` só lê o token.

## Segundo fator e login federado (capítulo 8)

A Dra. Eva (`eva@hospital.dev`, senha `mangueira-no-fim-da-rua`) já usa
TOTP. Segredo de laboratório: `5SCWGB6S2EW3ODL6YVCBVS4HUJDGETQJ`
(cadastre num app autenticador). Para o login OIDC real, suba um
Keycloak com o realm `hospital` e o cliente `mini-prontuario`; os testes
usam um provedor falso dentro da suíte.

## Modelos de acesso e políticas (capítulo 10)

`laboratorio/modelos` roda os 7 casos de `politicas/casos.json` contra
RBAC, RBAC com posse, ABAC e Cedar. As políticas Rego (OPA) e o modelo
OpenFGA de `politicas/` rodam com Docker; veja `politicas/README.md`.

## Matriz de permissões (capítulo 11)

```bash
python matriz.py rotas.json docs/PERMISSOES.md > matriz.http   # ver matriz.py
python placar.py matriz.http                                   # papel × rota
```

## O dono do objeto (capítulo 12)

Atendimentos e prescrições são buscados dentro do escopo de quem pede
(`atendimentos/escopo`): o que não se vê responde 404. A prescrição usa
a regra ABAC do capítulo 10 com o relógio real: fora do plantão, 403.

## Segredos e dependências (capítulo 13)

Copie `.env.exemplo` para `.env` e preencha com segredos reais (em
produção, o servidor recusa os valores de exemplo). `python varredura.py`
procura segredos em todo o histórico do git; `npm audit` / `pip-audit`
conferem as dependências.

## Portões de segurança (capítulo 14)

`bash scripts/portoes.sh` roda tudo o que o CI roda: tipos, testes,
censo, varredura de segredos, auditoria, ataques e papel × rota.

## Chaves de API e agentes (capítulo 15)

`POST /api/auth/chaves` (logado) cria uma chave com escopo; use-a em
`Authorization: ApiKey mp_...`. O laboratório `laboratorio/agente`
mostra o mesmo agente, com a mesma instrução injetada num cadastro,
sob uma chave larga e uma estreita.

## A régua do sênior (capítulo 16)

`python regua.py` confere o `REGUA.md`: cada competência marcada precisa
de evidência que existe (ataque, teste, arquivo). `REGUA.modelo.md` é a
régua em branco para o seu projeto; as decisões ficam em `docs/DECISOES.md`.
