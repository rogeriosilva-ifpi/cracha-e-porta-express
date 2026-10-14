# A régua do sênior — o seu projeto

Quarenta competências. Marque [x] só com evidência que existe neste
repositório: ataque (ATQ-xx), invariante (SEC-xx, nunca sozinho) ou
arquivo, com ::trecho quando for um teste ou uma seção. Confira com
`python regua.py`. Trinta com evidência equivalem a 75%.


## A · Modelo mental

- [ ] 01 Responde 401, 403 e 404 no caso certo e explica a escolha — 
- [ ] 02 Faz modelagem de ameaças de uma feature em 15 minutos — 
- [ ] 03 Coloca cada verificação na camada certa: borda, rota ou domínio — 
- [ ] 04 Faz rota nova nascer protegida; pública só por declaração — 
- [ ] 05 Classifica uma falha no OWASP Top 10 e no API Top 10 — 

## B · Senhas e credenciais

- [ ] 06 Usa argon2id nos parâmetros OWASP e migra hash antigo no login — 
- [ ] 07 Aplica a política de senha do NIST SP 800-63B-4 — 
- [ ] 08 Elimina enumeração de usuários por mensagem, status e tempo — 
- [ ] 09 Implementa reset com token de uso único, guardado com hash — 
- [ ] 10 Nunca registra segredo em log; sanitiza o que registra — 

## C · Sessão e cookies

- [ ] 11 Configura HttpOnly, Secure, SameSite e prefixo __Host- — 
- [ ] 12 Regenera a sessão no login (fixação de sessão) — 
- [ ] 13 Aplica expiração ociosa e absoluta; logout invalida no servidor — 
- [ ] 14 Defende CSRF quando a credencial é um cookie — 
- [ ] 15 Configura CORS com credenciais sem curinga nem origem refletida — 

## D · Tokens

- [ ] 16 Verifica JWT com algoritmo fixo, iss, aud e exp — 
- [ ] 17 Sabe o que pode e o que nunca vai no payload — 
- [ ] 18 Faz access curto + refresh com rotação e detecção de reuso — 
- [ ] 19 Decide onde o token mora no navegador e justifica — 
- [ ] 20 Planeja revogação e rotação de chaves (kid, JWKS) — 

## E · Federação e MFA

- [ ] 21 Integra login OIDC com Authorization Code + PKCE, state e nonce — 
- [ ] 22 Valida um ID token por completo — 
- [ ] 23 Implementa TOTP com códigos de recuperação — 
- [ ] 24 Explica passkeys e sabe quando adotá-las — 
- [ ] 25 Decide construir ou comprar autenticação com critérios explícitos — 

## F · Autorização

- [ ] 26 Escolhe entre ACL, RBAC, ABAC e ReBAC para uma regra real — 
- [ ] 27 Verifica permissões, não papéis, no código — 
- [ ] 28 Bloqueia IDOR/BOLA com consulta escopada por dono ou tenant — 
- [ ] 29 Bloqueia mass assignment e filtra campos na resposta — 
- [ ] 30 Expressa regra de domínio fora do middleware, com teste — 

## G · Operação

- [ ] 31 Limita tentativas por IP e por conta em login, reset e MFA — 
- [ ] 32 Registra eventos de segurança auditáveis, sem dado sensível — 
- [ ] 33 Falha fechado: exceção no caminho de acesso nunca libera — 
- [ ] 34 Mantém segredos fora do código e audita dependências — 
- [ ] 35 Roda no CI uma suíte de ataques papel × rota — 

## H · IA e máquinas

- [ ] 36 Escreve prompt de auth com restrições e critério de pronto verificável — 
- [ ] 37 Conduz revisão adversarial de código de acesso gerado por IA — 
- [ ] 38 Mantém invariantes de segurança no repositório que o agente lê — 
- [ ] 39 Emite chaves de API com prefixo, hash, escopo e expiração — 
- [ ] 40 Aplica mínimo privilégio a agentes e ferramentas de IA — 
