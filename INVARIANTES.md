# INVARIANTES

Regras que nenhum código pode violar, seja escrito por pessoa ou por
agente. Cada linha tem o capítulo que a criou e o teste que a prova.

## Segurança de acesso

- **SEC-01** Todo segredo, token ou código gerado vem de gerador
  criptográfico (`randomBytes`, `secrets`), nunca de `Math.random` ou
  `random`. Segredos são comparados em tempo constante
  (`timingSafeEqual`, `hmac.compare_digest`). Base64 não é proteção.
  *Cap. 2 · prova: revisão com grep do prompts/cap02.md.*
- **SEC-02** Toda rota declara política como primeiro middleware ou
  dependência; pública só se estiver em `PUBLICAS`.
  *Cap. 3 · prova: teste do censo.*
- **SEC-03** Resposta de erro só sai do tradutor de erros: nunca pilha,
  caminho de arquivo ou mensagem interna. Erro desconhecido vira 500
  genérico. *Cap. 3 · prova: ATQ-01.10.*
- **SEC-04** O mapa da API (`/docs`, `/openapi.json`) fica fechado fora
  do ambiente de desenvolvimento. *Cap. 3 · prova: teste do pipeline.*
- **SEC-05** Senha só é guardada como hash argon2id (parâmetros em
  `acesso/senhas`), nunca em texto, log ou resposta; hash antigo é
  refeito no login. *Cap. 4 · prova: ATQ-04.5 e teste de rehash.*
- **SEC-06** Política de senha NIST: 15 a 256 caracteres, sem regra
  de composição, recusa a lista de bloqueio e o próprio e-mail.
  *Cap. 4 · prova: ATQ-04.1, 04.2.*
- **SEC-07** Falha de login: 401 "Credenciais inválidas." e o mesmo
  tempo, exista ou não o e-mail (hash fictício).
  *Cap. 4 · prova: ATQ-04.3, 04.4 e cronometro.py < 5%.*
- **SEC-08** Token de redefinição: 32 bytes aleatórios, guardado só
  como sha256, expira em 15 min, uso único; a resposta do pedido é a
  mesma exista ou não o e-mail. *Cap. 4 · prova: testes de senha.*
- **SEC-09** Sessão vive no servidor; o banco guarda só o sha256 do
  token; o login sempre cria uma sessão nova e apaga a anterior.
  *Cap. 5 · prova: ATQ-05.3.*
- **SEC-10** Cookie `__Host-sessao` com HttpOnly, Secure, SameSite=Lax
  e Path=/. *Cap. 5 · prova: ATQ-05.1, 05.2.*
- **SEC-11** Sessão expira com 30 min sem uso e 8 h no total; logout e
  troca de senha apagam no servidor. *Cap. 5 · prova: ATQ-05.4 e testes.*
- **SEC-12** Método que altera dados com Origin fora da lista, ou
  Sec-Fetch-Site cross-site, recebe 403. CORS só com lista de origens.
  *Cap. 5 · prova: ATQ-05.5.*
- **SEC-13** Token de acesso: assinado com Ed25519 (EdDSA), `typ`
  at+jwt, `kid` no cabeçalho, 10 min de validade e só `iss`, `aud`,
  `sub`, `iat`, `exp`, `jti` e `sid` (a família, cap. 7). Nada
  pessoal; o papel vem do banco.
  *Cap. 6 · prova: ATQ-06.1 a 06.4 e raiox.py.*
- **SEC-14** Verificação com algoritmo fixo, `iss`, `aud`, `typ` e
  `exp` obrigatórios e 30 s de tolerância. Toda falha é 401, sem plano
  B: nunca decodificar sem verificar. *Cap. 6 · prova: ATQ-06.6 e testes.*
- **SEC-15** O JWKS publica só chaves públicas; a chave anterior fica
  até seus tokens vencerem. *Cap. 6 · prova: ATQ-06.5 e teste de rotação.*
- **SEC-16** Refresh token é opaco (32 bytes), guardado só como
  sha256, vale uma vez e pertence a uma família; parado 7 dias ou com
  a família acima de 30 dias, morre. *Cap. 7 · prova: testes de refresh.*
- **SEC-17** Refresh já trocado que reaparece revoga a família inteira
  e gera o evento `refresh_reutilizado`. *Cap. 7 · prova: ATQ-07.1, 07.2.*
- **SEC-18** "Sair de todos", troca de senha e desligamento revogam
  famílias e sessões; nossa API confere `sid` a cada pedido. Refresh
  nunca serve como access. *Cap. 7 · prova: ATQ-07.3 a 07.5.*
