# A régua do sênior — Mini-Prontuário · Express

Quarenta competências. Marque [x] só com evidência que existe neste
repositório: ataque (ATQ-xx), invariante (SEC-xx, nunca sozinho) ou
arquivo, com ::trecho quando for um teste ou uma seção. Confira com
`python regua.py`. Trinta com evidência equivalem a 75%.


## A · Modelo mental

- [x] 01 Responde 401, 403 e 404 no caso certo e explica a escolha — ATQ-01.1 · ATQ-01.5 · ATQ-12.1 · tests/objeto.test.ts::404, não 403
- [x] 02 Faz modelagem de ameaças de uma feature em 15 minutos — docs/AMEACAS.md::STRIDE
- [x] 03 Coloca cada verificação na camada certa: borda, rota ou domínio — SEC-25 · SEC-30 · tests/pipeline.test.ts::portão 2
- [x] 04 Faz rota nova nascer protegida; pública só por declaração — SEC-02 · tests/censo.test.ts::toda rota declara política
- [x] 05 Classifica uma falha no OWASP Top 10 e no API Top 10 — docs/ASVS.md · docs/AMEACAS.md::ATQ-01.4

## B · Senhas e credenciais

- [x] 06 Usa argon2id nos parâmetros OWASP e migra hash antigo no login — SEC-05 · tests/senhas.test.ts::rehash transparente
- [x] 07 Aplica a política de senha do NIST SP 800-63B-4 — SEC-06 · ATQ-04.1 · ATQ-04.2 · tests/senhas.test.ts::sem regra de composição
- [x] 08 Elimina enumeração de usuários por mensagem, status e tempo — SEC-07 · ATQ-04.3 · ATQ-04.4 · cronometro.py
- [x] 09 Implementa reset com token de uso único, guardado com hash — SEC-08 · tests/senhas.test.ts::token funciona uma vez só
- [x] 10 Nunca registra segredo em log; sanitiza o que registra — SEC-23 · tests/limites.test.ts::sem senha e sem e-mail

## C · Sessão e cookies

- [x] 11 Configura HttpOnly, Secure, SameSite e prefixo __Host- — SEC-10 · ATQ-05.1 · ATQ-05.2 · tests/sessoes.test.ts::prefixo __Host-
- [x] 12 Regenera a sessão no login (fixação de sessão) — ATQ-05.3 · tests/sessoes.test.ts::(fixação)
- [x] 13 Aplica expiração ociosa e absoluta; logout invalida no servidor — SEC-11 · ATQ-05.4 · tests/sessoes.test.ts::limite absoluto
- [x] 14 Defende CSRF quando a credencial é um cookie — SEC-12 · ATQ-05.5 · tests/sessoes.test.ts::outro site é recusado
- [x] 15 Configura CORS com credenciais sem curinga nem origem refletida — tests/pipeline.test.ts::CORS: origem da lista

## D · Tokens

- [x] 16 Verifica JWT com algoritmo fixo, iss, aud e exp — SEC-14 · ATQ-06.4 · tests/tokens.test.ts::outra audiência
- [x] 17 Sabe o que pode e o que nunca vai no payload — ATQ-06.1 · tests/tokens.test.ts::nenhum dado pessoal
- [x] 18 Faz access curto + refresh com rotação e detecção de reuso — SEC-16 · SEC-17 · ATQ-07.1 · ATQ-07.2 · tests/refresh.test.ts::reuso derruba a família
- [x] 19 Decide onde o token mora no navegador e justifica — docs/DECISOES.md::ADR-01
- [x] 20 Planeja revogação e rotação de chaves (kid, JWKS) — SEC-15 · ATQ-06.5 · tests/tokens.test.ts::chave anterior vale até vencer

## E · Federação e MFA

- [x] 21 Integra login OIDC com Authorization Code + PKCE, state e nonce — SEC-21 · ATQ-08.4 · tests/oidc.test.ts::fluxo completo
- [x] 22 Valida um ID token por completo — tests/oidc.test.ts::emitido para outro cliente
- [x] 23 Implementa TOTP com códigos de recuperação — SEC-19 · SEC-20 · ATQ-08.1 · ATQ-08.3 · tests/mfa.test.ts::10 códigos de uso único
- [x] 24 Explica passkeys e sabe quando adotá-las — docs/DECISOES.md::ADR-03
- [x] 25 Decide construir ou comprar autenticação com critérios explícitos — docs/DECISOES.md::ADR-02

## F · Autorização

- [x] 26 Escolhe entre ACL, RBAC, ABAC e ReBAC para uma regra real — docs/DECISOES.md::ADR-04 · politicas/casos.json · tests/decisao.test.ts::RBAC puro erra
- [x] 27 Verifica permissões, não papéis, no código — SEC-27 · ATQ-11.1 · docs/PERMISSOES.md
- [x] 28 Bloqueia IDOR/BOLA com consulta escopada por dono ou tenant — SEC-30 · ATQ-12.1 · ATQ-12.5 · tests/objeto.test.ts::a lista já vem escopada
- [x] 29 Bloqueia mass assignment e filtra campos na resposta — SEC-31 · SEC-32 · ATQ-12.3 · ATQ-12.4 · ATQ-12.6 · tests/objeto.test.ts::campo fora da lista
- [x] 30 Expressa regra de domínio fora do middleware, com teste — SEC-25 · SEC-26 · tests/objeto.test.ts::fora do plantão

## G · Operação

- [x] 31 Limita tentativas por IP e por conta em login, reset e MFA — SEC-22 · tests/limites.test.ts::50 falhas espalhadas
- [x] 32 Registra eventos de segurança auditáveis, sem dado sensível — SEC-23 · tests/chaves.test.ts::com evento
- [x] 33 Falha fechado: exceção no caminho de acesso nunca libera — SEC-24 · ATQ-06.6 · tests/limites.test.ts::nunca acesso
- [x] 34 Mantém segredos fora do código e audita dependências — SEC-33 · SEC-34 · varredura.py · scripts/portoes.sh::dependências · tests/segredos.test.ts::não sobe
- [x] 35 Roda no CI uma suíte de ataques papel × rota — SEC-28 · SEC-36 · .github/workflows/seguranca.yml · scripts/portoes.sh::matriz

## H · IA e máquinas

- [x] 36 Escreve prompt de auth com restrições e critério de pronto verificável — prompts/cap04.md::Done when · prompts/cap15.md::Done when
- [x] 37 Conduz revisão adversarial de código de acesso gerado por IA — SEC-37 · prompts/cap15.md::contexto novo
- [x] 38 Mantém invariantes de segurança no repositório que o agente lê — INVARIANTES.md::SEC-41 · AGENTS.md::MENOR escopo
- [x] 39 Emite chaves de API com prefixo, hash, escopo e expiração — SEC-38 · SEC-40 · ATQ-15.4 · ATQ-15.6 · tests/chaves.test.ts::vencida é 401
- [x] 40 Aplica mínimo privilégio a agentes e ferramentas de IA — SEC-39 · ATQ-15.1 · ATQ-15.2 · tests/chaves.test.ts::chave estreita leva 403
