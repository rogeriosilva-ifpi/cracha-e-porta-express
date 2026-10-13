# Capítulo 1 · O crachá e a porta — prompts complementares

O livro traz o prompt de agente. Aqui estão a variante para o chat e o
prompt de revisão.

## Chat · C-P-T-R-F-A

```
C  API Express 5 + TS (ou FastAPI) de prontuário. Colo abaixo a lista
   de rotas e docs/PERMISSOES.md.
P  Especialista em AppSec fazendo modelagem de ameaças com STRIDE.
T  Para cada letra do STRIDE, liste 2 abusos concretos contra ESTAS rotas.
R  Só abusos de acesso e de dados; nada de infraestrutura. Não proponha
   código. Se uma letra não se aplicar, diga por quê.
F  Tabela: letra, abuso, rota, portão (borda, 1, 2 ou 3).
A  Cada abuso cita uma rota real da lista.
```

## Revisão · contexto novo

```
Leia docs/AMEACAS.md e ataques.http.
Liste os abusos sem ataque correspondente e escreva o bloco .http de
cada um, com # @espera no comportamento seguro. Não altere arquivos.
```
