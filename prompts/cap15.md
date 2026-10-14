# Capítulo 15 · Agentes, chaves e o menor privilégio — prompts complementares

## Agente · versão FastAPI

```
Goal
Chaves de API com escopo para integrações e agentes.

Context
@src/prontuario/acesso/identidade.py @src/prontuario/acesso/politica.py
@docs/PERMISSOES.md @INVARIANTES.md @ataques.http

Constraints
- formato mp_<8 hex>_<32 bytes base64url>; guardar só sha256; mostrar uma vez
- escopos: lista explícita de Permissao, subconjunto do papel; sem "*"
- validade 1..90 dias; máximo 10 ativas por pessoa
- Authorization: ApiKey <chave>; papel de hoje E escopo; fora = 403 + evento
- chave não usa rotas autenticada(); DELETE só da própria (outra = 404)
- desligar e trocar papel revogam as chaves
- GET /.well-known/oauth-protected-resource (RFC 9728); 401 com
  WWW-Authenticate resource_metadata

Done when
- placar 54/54 e portoes.sh todo ok
- teste do agente: chave estreita leva 403 com a mesma instrução injetada
```

## Chat · C-P-T-R-F-A

```
C  Vou ligar um assistente de IA à API (descrevo a tarefa dele).
P  Engenheiro de segurança desconfiado de agentes.
T  Defina a credencial do agente: escopos mínimos, validade, o que
   exige confirmação humana e que evento registrar.
R  Suponha que todo texto lido pelo agente pode conter instruções de
   terceiros. Nada de "dar acesso total para testar".
F  Tabela ferramenta × permissão × confirmação + o pedido de criação
   da chave.
A  Cada permissão justificada por uma ferramenta usada na tarefa.
```

## Revisão · contexto novo

```
Leia o diff do capítulo 15 e responda só com evidências do código:
1. A chave em texto aparece em algum log, resposta de listagem ou banco?
2. Existe caminho em que uma chave cria outra ou amplia o escopo?
3. O escopo é conferido em TODA rota com permissão (exige e escopos)?
4. Trocar o papel da pessoa reduz o que a chave faz na próxima chamada?
Para cada "sim, há falha": o teste negativo que a prova.
```
