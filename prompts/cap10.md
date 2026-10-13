# Capítulo 10 · Modelos de acesso e políticas como código — prompts complementares

## Agente · versão Express

```
Goal
A regra "prescrever" como ABAC em src/acesso/decisao.ts e em Cedar
(politicas/prontuario.cedar), as duas validadas pela mesma tabela.

Context
@src/acesso/ @politicas/ @INVARIANTES.md
Express 5 + TS, @cedar-policy/cedar-wasm (já no package.json).

Constraints
- contrato: (sujeito, recurso, contexto) -> { permitido, motivo }
- de_plantao calculado no app (escala), passado no contexto
- Cedar: nega por padrão; forbid para registro suspenso; @id em
  toda política; erro de política nega
- testes leem politicas/casos.json (it.each), sem casos inventados
  no próprio teste

Done when
- npm run check limpo; npm test verde
- npx tsx laboratorio/modelos.ts: ABAC e Cedar com 0 erros
```

## Chat · C-P-T-R-F-A

```
C  Mini-Prontuário: papéis admin, profissional, recepcao; atendimento
   tem autor e status; escala de plantões. Regra: só o profissional
   autor, com atendimento aberto e de plantão, prescreve.
P  Arquiteto de segurança que ensina modelos de acesso.
T  Mostre a regra em RBAC, RBAC com posse, ABAC e ReBAC, e diga qual
   caso cada modelo erra.
R  Sem código de framework; pseudocódigo curto; uma tabela final.
F  Quatro blocos curtos + tabela caso x modelo.
A  A tabela bate com laboratorio/modelos.ts.
```

## Revisão · contexto novo

```
Revise src/acesso/decisao, src/acesso/cedar e politicas/ contra
INVARIANTES.md (SEC-25 e SEC-26). Procure: checagem de papel onde a
regra depende do recurso; decisão sem motivo; erro de política que
libera; casos de teste escritos só no teste e não na tabela; política
Cedar sem @id ou com permit amplo demais. Para cada achado:
arquivo:linha e o caso que falta na tabela.
```
