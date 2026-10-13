# Capítulo 5 · Sessões e cookies — prompts complementares

## Agente · versão FastAPI

```
Goal
Sessões no servidor para o login de src/prontuario/auth/, com logout
real e defesa contra CSRF.

Context
@src/prontuario/acesso/ @src/prontuario/auth/ @src/prontuario/http/
@INVARIANTES.md

Constraints
- tabela sessoes guarda sha256 do token, nunca o token
- token: secrets.token_urlsafe(32); login apaga a sessão anterior
- cookie __Host-sessao: httponly, secure, samesite="lax", path="/"
- expira com 30 min sem uso e 8 h no total
- logout apaga a sessão no servidor; troca de senha derruba todas
- POST/PATCH com Origin fora de ORIGENS: 403
- nenhuma dependência nova

Done when
- uv run pytest verde
- placar: ATQ-05.1 a 05.5 defendidos; nenhum ataque antigo regride
```

## Chat · C-P-T-R-F-A

```
C  Express 5 + TS, better-sqlite3, pacote cookie 2.x (parseCookie).
   Colo abaixo src/acesso/sessoes.ts.
P  Dev sênior de backend com foco em segurança.
T  Escreva só a função iniciar(req, res, usuarioId).
R  Apaga a sessão que vier no cookie; token de randomBytes(32);
   grava só o sha256; cookie __Host-sessao com httpOnly, secure,
   sameSite "lax", path "/", maxAge de 8 h; sem libs novas.
F  Só a função, comentada em português.
A  ATQ-05.1, 05.2 e 05.3 defendidos.
```

## Revisão · contexto novo

```
Revise src/acesso/sessoes.ts, src/http/origem.ts e src/auth/ contra
INVARIANTES.md (SEC-09 a SEC-12). Procure: token de sessão guardado
em texto; sessão reaproveitada no login; cookie sem HttpOnly, Secure
ou SameSite; logout que só apaga o cookie; ausência de expiração
ociosa ou absoluta; método que altera dados sem checagem de Origin;
CORS com "*" ou origem refletida junto com credenciais. Para cada
achado: arquivo:linha e um bloco .http que o demonstre.
```
