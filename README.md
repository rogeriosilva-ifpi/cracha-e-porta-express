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
