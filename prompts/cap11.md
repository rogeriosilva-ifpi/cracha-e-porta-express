# Capítulo 11 · RBAC no código — prompts complementares

## Agente · versão FastAPI

```
Goal
Funções administrativas (desligar, trocar papel) e relatório com
permissão declarada; censo que recusa rota de domínio só "autenticada";
suíte papel x rota gerada pela matriz.

Context
@src/prontuario/acesso/ @src/prontuario/admin/ @docs/PERMISSOES.md
@INVARIANTES.md · FastAPI.

Constraints
- Depends(exige("user:admin")) nas funções administrativas
- nenhum if usuario["papel"] == ... em handler
- troca de papel e desligamento: encerrar_todas + revogar_todas +
  evento; papel nunca vem do corpo de quem pede para si
- censo: rota fora de /api/auth/* com só autenticada é problema
- scripts/censo.py --json; matriz.py gera matriz.http

Done when
- uv run pytest verde; censo com 0 problemas
- placar: ATQ-11.1 defendido; python placar.py matriz.http: 100%
```

## Chat · C-P-T-R-F-A

```
C  Express 5 + TS, @casl/ability 7. Colo src/acesso/permissoes.ts.
P  Dev sênior de backend.
T  Escreva habilidades(usuario) com CASL a partir da MATRIZ, mais a
   condição "prescrever só no próprio atendimento aberto".
R  Cada permissão vira (ação, assunto) por uma tabela de tradução;
   nada de papel escrito à mão; teste de equivalência com a matriz.
F  Código + teste vitest.
A  Para todo papel e permissão, ability.can === pode().
```

## Revisão · contexto novo

```
Revise src/ contra INVARIANTES.md (SEC-27 a SEC-29) e
docs/PERMISSOES.md. Procure com grep: "papel ===", "papel !==",
"includes(req.usuario", "papel ==", rotas em /api/admin com
autenticada(), papel lido de req.body, troca de papel sem derrubar
sessões. Rode o censo e a suíte matriz.http. Para cada achado:
arquivo:linha e o teste da matriz que deveria pegá-lo.
```
