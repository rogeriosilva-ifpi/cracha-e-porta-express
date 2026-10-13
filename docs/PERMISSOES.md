# Matriz de permissões — Mini-Prontuário

Fonte única do portão 2. O código lê `MATRIZ` em `acesso/permissoes`;
este arquivo é a versão legível para pessoas e agentes. Mudou aqui,
muda lá, no mesmo commit.

| Permissão          | admin | profissional | recepcao |
|--------------------|:-----:|:------------:|:--------:|
| `patient:read`     |  ✅   |      ✅      |    ✅    |
| `patient:create`   |  ✅   |      ✅      |    ✅    |
| `encounter:read`   |  ✅   |      ✅      |    ✅    |
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

Regra de domínio (portão 3, capítulo 12): o profissional só prescreve
no atendimento que ele mesmo registrou. Nenhuma linha desta tabela
expressa isso — e é por isso que ela não basta.
