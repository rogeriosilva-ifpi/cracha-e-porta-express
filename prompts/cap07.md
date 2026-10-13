# Capítulo 7 · Access, refresh e o navegador — prompts complementares

## Agente · versão FastAPI

```
Goal
Refresh token com rotação e detecção de reuso: POST /api/auth/refresh,
POST /api/auth/logout-all e logout do app por família.

Context
@src/prontuario/acesso/ @src/prontuario/auth/ @INVARIANTES.md
Tabelas familias e refresh_tokens em compartilhado/banco.py.

Constraints
- refresh opaco: secrets.token_urlsafe(32); banco guarda o sha256
- uma família por login de app; access leva sid = família
- girar: UPDATE ... SET usado = 1 WHERE usado = 0 (atômico)
- refresh usado que reaparece: revoga a família e loga
  refresh_reutilizado (sem o token)
- logout-all e troca de senha: revogar_todas + encerrar_todas
- identificar() recusa access de família revogada
- nenhuma dependência nova

Done when
- uv run pytest verde
- placar: ATQ-07.1 a 07.5 defendidos; nenhum ataque antigo regride
```

## Chat · C-P-T-R-F-A

```
C  Express 5 + TS, better-sqlite3. Colo abaixo src/acesso/refresh.ts
   e o esquema das tabelas familias e refresh_tokens.
P  Dev sênior de backend com foco em segurança.
T  Escreva só girar(token).
R  Busca pelo sha256; família ativa; UPDATE atômico marcando usado;
   se o token já estava usado, revoga a família e registra o evento
   sem o token; devolve usuário, família e um refresh novo.
F  Só a função, comentada em português.
A  tests/refresh.test.ts passa, inclusive "só um vence".
```

## Revisão · contexto novo

```
Revise src/acesso/refresh.ts, identidade e src/auth/ contra
INVARIANTES.md (SEC-16 a SEC-18). Procure: refresh em formato JWT ou
aceito como Bearer; refresh guardado em texto; rotação sem marcar o
antigo; ausência de detecção de reuso; SELECT seguido de UPDATE sem
condição (corrida); logout-all que só apaga cookies; token completo em
log. Para cada achado: arquivo:linha e um bloco .http que o demonstre.
```
