# Capítulo 16 · Prompts-base de acesso

Modelos para qualquer fatia de autenticação ou autorização. Troque o que
está entre <>; não apague as restrições.

## Agente · fatia de acesso

```
Goal
<uma fatia pequena: uma rota, uma regra, um fluxo>

Context
@src/acesso/ @INVARIANTES.md @docs/PERMISSOES.md @ataques.http
<stack, bibliotecas já instaladas>

Constraints
- rota nova: política declarada (exige/permissão), nunca só login
- objeto: busca dentro do escopo de quem pede; 404 se não vê
- identidade só de identificar(); nada de papel no corpo
- erro no caminho de acesso: 500 genérico, nunca acesso
- nenhum segredo no código; nenhuma dependência nova sem pedir
- fora de escopo: <o que a IA não deve tocar>

Done when
- testes negativos novos, vermelhos antes e verdes depois
- placar e matriz sem regressão; bash scripts/portoes.sh verde
- python regua.py sem item perdido
```

## Chat · C-P-T-R-F-A

```
C  <stack> · colo <arquivo/trecho> e o invariante envolvido.
P  Dev sênior de backend com foco em AppSec.
T  <uma função ou rota>.
R  <restrições do invariante>; sem libs novas; sem log de segredo.
F  Só o código, comentado em português, mais um teste negativo.
A  <ID do ataque> passa a ser defendido.
```

## Revisão adversarial · contexto novo

```
Você é pentester revisando este diff contra INVARIANTES.md e os oito
vícios do capítulo 15. Para cada achado: arquivo:linha, invariante ou
categoria OWASP, um ataque concreto no formato do ataques.http e a
correção mínima. Se não houver achado, diga "nenhum achado".
```
