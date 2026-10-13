# Capítulo 8 · Além da senha — prompts complementares

## Agente · versão Express

```
Goal
Segundo fator TOTP com códigos de recuperação, e login OIDC com
Authorization Code + PKCE, sem quebrar o login por senha.

Context
@src/acesso/ @src/auth/ @INVARIANTES.md
Express 5 + TS, otpauth e jose (já no package.json).

Constraints
- senha certa de quem tem MFA: só um desafio (5 min, 5 tentativas)
- TOTP com janela ±1 passo e ultimo_passo (sem reuso do código)
- 10 códigos de recuperação, sha256, uso único
- OIDC: state em cookie __Host-, uso único; nonce; PKCE S256;
  jwtVerify com issuer, audience e algoritmos fixos
- conta externa só por vínculo emissor + sub; nunca por e-mail
- testes de OIDC com provedor falso dentro da suíte

Done when
- npm run check limpo; npm test verde
- placar: ATQ-08.1 a 08.4 defendidos
```

## Chat · C-P-T-R-F-A

```
C  FastAPI, PyJWT. Colo abaixo prontuario/auth/oidc.py.
P  Dev sênior de backend com foco em identidade.
T  Escreva só a validação do ID token no callback.
R  jwt.decode com algorithms fixos, issuer, audience, leeway=30 e
   require de sub/exp/iat/nonce; nonce comparado em tempo constante
   com o do pedido; qualquer falha vira 401.
F  Só o trecho, comentado em português.
A  tests/test_oidc.py passa.
```

## Revisão · contexto novo

```
Revise src/acesso/mfa e src/auth/oidc contra INVARIANTES.md (SEC-19 a
SEC-21). Procure: sessão ou token emitidos antes do segundo fator;
TOTP sem proteção contra reuso; tentativas ilimitadas no desafio;
códigos de recuperação em texto; callback sem state ou sem cookie;
nonce não conferido; ID token apenas decodificado; usuário achado pelo
e-mail do provedor. Para cada achado: arquivo:linha e o teste que o prova.
```
