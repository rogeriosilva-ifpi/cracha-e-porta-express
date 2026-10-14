# Mini-Prontuário × OWASP ASVS 5.0

Checklist de revisão por capítulo do ASVS 5.0. Para cada capítulo, onde
o Mini-Prontuário atende e qual prova roda no CI (`scripts/portoes.sh`).

| ASVS 5.0 | Onde | Prova |
|---|---|---|
| V2 Validação e lógica de negócio | esquemas estritos, regra de prescrição | testes de objeto, ATQ-12.x |
| V4 API e serviços web | censo, CORS, origem | censo, ATQ-05.5 |
| V6 Autenticação | senhas (cap. 4), MFA (cap. 8), limites (cap. 9) | ATQ-04.x, 08.x, testes de limite |
| V7 Sessão | sessões no servidor (cap. 5) | ATQ-05.x, testes de sessão |
| V8 Autorização | matriz (cap. 11), objeto (cap. 12), decisão (cap. 10) | matriz.http, ATQ-11.x, 12.x |
| V9 Tokens autocontidos | JWT (cap. 6), refresh (cap. 7) | ATQ-06.x, 07.x, raiox.py |
| V10 OAuth e OIDC | login federado (cap. 8) | testes de OIDC |
| V11 Criptografia | hash, HMAC, AES-GCM (caps. 2, 4, 13) | testes de cifra |
| V13 Configuração | segredos do ambiente (cap. 13) | testes de configuração, varredura |
| V14 Proteção de dados | saída por esquema, TOTP cifrado | ATQ-01.13, 12.4 |
| V16 Registro e erros | eventos, erro sem pilha (caps. 3, 9) | teste de eventos, ATQ-01.x |

Fora do escopo do livro: V1, V3, V5, V12, V15 e V17. Use os
requisitos de cada capítulo do ASVS como lista de perguntas na revisão.
