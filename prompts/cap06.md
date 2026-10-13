# Capítulo 6 · JWT por dentro — prompts complementares

## Agente · versão FastAPI

```
Goal
Token de acesso para clientes de API: POST /api/auth/token e
GET /.well-known/jwks.json, aceitos por identificar() como Bearer.

Context
@src/prontuario/acesso/ @src/prontuario/auth/ @INVARIANTES.md
FastAPI, PyJWT[crypto] (já no pyproject).

Constraints
- Ed25519 (algorithm="EdDSA"); cabeçalho com kid e typ "at+jwt"
- conteúdo: só iss, aud, sub, iat, exp (10 min) e jti
- decode com algorithms=["EdDSA"], issuer, audience, leeway=30 e
  options={"require": [...]}; kid escolhe a chave do chaveiro
- InvalidTokenError -> 401; nunca verify_signature False
- Bearer inválido não cai para o cookie
- nenhuma dependência nova

Done when
- uv run pytest verde
- raiox.py sem RISCO; placar: ATQ-06.1 a 06.6 defendidos
```

## Chat · C-P-T-R-F-A

```
C  Express 5 + TS, biblioteca jose 6. Colo abaixo src/acesso/tokens.ts.
P  Dev sênior de backend com foco em segurança.
T  Escreva só verificarAccess(token).
R  jwtVerify com algorithms ["EdDSA"], issuer, audience, typ "at+jwt",
   requiredClaims exp/iat/sub/jti, clockTolerance 30; a chave vem do
   chaveiro pelo kid; nenhum try/catch dentro da função.
F  Só a função, comentada em português.
A  Os testes de tests/tokens.test.ts passam.
```

## Revisão · contexto novo

```
Revise src/acesso/ e src/auth/ contra INVARIANTES.md (SEC-13 a
SEC-15). Procure com grep: decodeJwt, decode( sem verificação,
verify_signature, algorithms vindo do cabeçalho do token, HS256 com
segredo literal, expiresIn longo, dados pessoais no payload, catch que
devolve o payload. Para cada achado: arquivo:linha, o risco em uma
frase e o teste que o prova.
```
