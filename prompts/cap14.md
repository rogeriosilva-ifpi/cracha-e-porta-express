# Capítulo 14 · Testar acesso como um atacante — prompts complementares

## Agente · versão FastAPI

```
Goal
Os portões de segurança rodando no CI: scripts/portoes.sh e
.github/workflows/seguranca.yml.

Context
@scripts/ @tests/ @ataques.http @docs/PERMISSOES.md @INVARIANTES.md

Constraints
- portões: compilação, pytest, censo, varredura, pip-audit,
  placar de ataques.http e de matriz.http
- cada portão mostra uma linha de resumo; qualquer falha = exit 1
- o servidor de teste sobe numa porta própria e cai no fim (grupo)
- checkout com fetch-depth 0; uv sync --locked

Done when
- bash scripts/portoes.sh: todos ok localmente
- um portão quebrado de propósito deixa o script vermelho
```

## Chat · C-P-T-R-F-A

```
C  Acabei de corrigir uma falha de acesso (colo o diff).
P  Revisor de segurança que só aceita correção com prova.
T  Escreva o teste negativo e o bloco ATQ-xx que provam a correção.
R  O teste tem de FALHAR no código antes da correção; diga como
   verificar isso (revert local ou worktree da tag anterior).
F  Teste + bloco .http + comando para a prova de revert.
A  Vermelho antes, verde depois.
```

## Revisão · contexto novo

```
Use docs/ASVS.md como roteiro. Para cada linha, confira se a prova
citada existe e roda no CI. Liste: requisitos sem prova, provas que só
testam o caminho feliz, ataques do placar sem teste equivalente na
suíte. Para cada lacuna: o teste negativo que falta.
```
