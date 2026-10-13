# Capítulo 4 · Senhas do jeito certo — prompts complementares

## Agente · versão FastAPI

```
Goal
Login e criação de usuário com senha em src/prontuario/auth/ e admin/,
com argon2id e resposta igual para e-mail inexistente e senha errada.

Context
@src/prontuario/acesso/ @src/prontuario/auth/ @INVARIANTES.md
FastAPI, Pydantic, sqlite3. pwdlib[argon2] já está no pyproject.

Constraints
- Argon2Hasher(time_cost=2, memory_cost=19456, parallelism=1)
- senha: mínimo 15, máximo 256, sem regra de composição;
  recusar dados/senhas-comuns.txt e senha com o e-mail
- e-mail inexistente: verify contra HASH_FICTICIO
- falha de login: 401 "Credenciais inválidas."
- verify_and_update: hash antigo é refeito no login
- consultas sempre parametrizadas (?); nenhuma dependência nova

Done when
- uv run pytest verde
- python cronometro.py --base http://localhost:8000: diferença < 5%
- placar: ATQ-04.1 a 04.5 defendidos
```

## Chat · C-P-T-R-F-A

```
C  Express 5 + TS, Zod, better-sqlite3, argon2. Colo abaixo
   src/acesso/senhas.ts e src/auth/rotas.ts.
P  Dev sênior de backend com foco em segurança.
T  Escreva só o handler POST /api/auth/login.
R  argon2.verify; HASH_FICTICIO quando o e-mail não existe; 401 com a
   mensagem "Credenciais inválidas." em todo erro; precisaRehash ->
   trocarHash; resposta sem passwordHash; sem libs novas.
F  Só o handler, comentado em português.
A  ATQ-04.3, 04.4 e 04.5 defendidos; cronometro.py abaixo de 5%.
```

## Revisão · contexto novo

```
Revise src/acesso/senhas.ts, src/auth/ e src/admin/ contra
INVARIANTES.md (SEC-05 a SEC-08) e OWASP A04/A07. Procure: senha ou
hash em log ou resposta; mensagem ou status diferente por motivo de
falha; caminho de login sem verificação quando o e-mail não existe;
SQL montado com concatenação; token de redefinição guardado sem hash,
sem expiração ou reutilizável. Para cada achado: arquivo:linha, o
ataque em formato .http e a correção mínima. Não reescreva código.
```
