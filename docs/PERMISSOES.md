# Matriz de permissões — Mini-Prontuário

Fonte única do portão 2. O código lê `MATRIZ` em `acesso/permissoes`;
este arquivo é a versão legível para pessoas e agentes. Mudou aqui,
muda lá, no mesmo commit.

| Permissão          | admin | profissional | recepcao |
|--------------------|:-----:|:------------:|:--------:|
| `patient:read`     |  ✅   |      ✅      |    ✅    |
| `patient:create`   |  ✅   |      ✅      |    ✅    |
| `encounter:read`   |  ✅   |      ✅      |    ✅    |
| `encounter:read_any` | ✅  |      ❌      |    ✅    |
| `encounter:update` |  ✅   |      ✅      |    ❌    |
| `rx:read`          |  ✅   |      ✅      |    ❌    |
| `rx:create`        |  ❌   |      ✅      |    ❌    |
| `user:admin`       |  ✅   |      ❌      |    ❌    |

Regras de uso (capítulo 11):

- toda rota fora de `/api/auth/*` declara uma destas permissões; o censo
  recusa rota de domínio só com `autenticada`;
- `matriz.py` gera `matriz.http` a partir desta tabela e do censo: um
  teste para cada papel × rota; rode depois de mudar qualquer linha;
- troca de papel derruba as sessões e os apps da pessoa.

Regras de objeto (portão 3, capítulo 12), que esta tabela não expressa
sozinha e que moram em `atendimentos/escopo` e `acesso/decisao`:

- sem `encounter:read_any`, a pessoa vê só os atendimentos que registrou;
  o que não vê responde 404, como se não existisse;
- dado clínico (motivo) só para o autor do atendimento; os outros
  recebem o resumo;
- só o autor altera o atendimento (403 para quem vê e não é autor);
- prescrever: autor, atendimento aberto, de plantão, registro ativo
  (capítulo 10); quem prescreve vem da sessão, nunca do corpo.

Chaves de API (capítulo 15): credencial de máquinas, scripts e agentes.

- formato `mp_<id>_<segredo>`; guardamos só o sha256; a chave aparece
  uma vez, na criação;
- escopo = lista explícita das permissões acima, subconjunto do papel
  de quem cria; sem curinga; validade de 1 a 90 dias;
- no uso valem as duas coisas: o papel de HOJE e o escopo da chave;
- chave não gerencia conta (rotas `autenticada`), não cria chave;
- desligamento e troca de papel revogam as chaves da pessoa.
