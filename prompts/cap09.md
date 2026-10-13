# Capítulo 9 · Defesas da porta de entrada — prompts complementares

## Agente · versão FastAPI

```
Goal
Limites de tentativa no login e eventos de segurança, sem tornar o
bloqueio uma arma contra o usuário legítimo.

Context
@src/prontuario/acesso/ @src/prontuario/auth/ @INVARIANTES.md
FastAPI, slowapi (já no pyproject).

Constraints
- slowapi "100/15minutes" por IP nas rotas de entrada
- falhas por conta+IP (5/15 min) e por conta (50/1 h), conferidas
  ANTES do argon2; senha certa zera a de conta+IP
- 429 com Retry-After, igual para e-mail que existe ou não
- eventos JSON no logger prontuario.seguranca; e-mail só como hash
  curto; nunca senha, token ou código
- exceção ao identificar: 500 genérico
- conftest zera os limites entre testes

Done when
- uv run pytest verde, incluindo tests/test_limites.py
- placar sem regressão
```

## Chat · C-P-T-R-F-A

```
C  Express 5 + TS, express-rate-limit 8. Colo src/acesso/limites.ts.
P  Dev sênior de backend com foco em segurança.
T  Explique e ajuste a configuração para rodar atrás de um proxy
   reverso (nginx) sem que X-Forwarded-For forjado burle o limite.
R  app.set("trust proxy", ...) com o número exato de saltos; nada
   de "true"; mostre como testar.
F  Explicação curta + diff.
A  Os testes de limite continuam verdes.
```

## Revisão · contexto novo

```
Revise src/acesso/limites, src/auth e src/compartilhado/eventos contra
INVARIANTES.md (SEC-22 a SEC-24). Procure: limite só por IP; bloqueio
permanente de conta; limite conferido depois do hash; 429 diferente
para conta inexistente; "trust proxy" true; log com corpo de
requisição, senha, token ou e-mail; catch no caminho de acesso que
chama next() ou devolve 200. Para cada achado: arquivo:linha e o
teste que o prova.
```
