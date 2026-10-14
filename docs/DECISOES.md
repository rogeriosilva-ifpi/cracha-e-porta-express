# Decisões registradas — Mini-Prontuário (capítulo 16)

Cada decisão tem contexto, escolha, alternativas recusadas e o que nos
faria mudar de ideia. Decisão que não está aqui não foi tomada; foi
herdada por acaso.

## ADR-01 · Onde a credencial mora no navegador (cap. 5 e 7)
- Contexto: dado de saúde; qualquer XSS lê o que estiver em localStorage.
- Escolha: navegador só recebe cookie `__Host-sessao` (HttpOnly, Secure,
  SameSite=Lax). Apps fora do navegador usam access de 10 min em memória
  e refresh opaco com rotação. Um SPA de outro domínio usaria BFF.
- Recusado: tokens em localStorage; refresh acessível a JavaScript.
- Mudaríamos se: o front-end passasse a ser só um app nativo.

## ADR-02 · Construir ou comprar a autenticação (cap. 8)
- Contexto: o livro constrói à mão para ensinar o mecanismo.
- Escolha em produção: comprar ou adotar (Better Auth, Authlib +
  Keycloak, ou um provedor) quando houver passkeys, MFA e operação 24 h
  prontos; manter aqui a autorização e a suíte de ataques.
- Critérios: onde ficam os dados pessoais (LGPD), custo por usuário
  ativo, como sair do fornecedor, quem responde às 3 da manhã.
- Mudaríamos se: o hospital exigisse que nada saísse da rede interna.

## ADR-03 · Segundo fator (cap. 8)
- Escolha: TOTP com 10 códigos de recuperação, já; passkeys (WebAuthn)
  como direção, obrigatórias para admin quando o cadastro estiver pronto.
- Por quê: TOTP é aceito por phishing em tempo real; passkey não, porque
  a assinatura inclui a origem real da página.

## ADR-04 · Modelo de acesso (cap. 10 a 12)
- Escolha: RBAC por permissões (matriz) para ação; regra de objeto no
  domínio (autor, escopo de visibilidade); ABAC (plantão) para prescrever,
  com tabela de casos compartilhada entre as implementações.
- Recusado: RBAC puro (erra casos da tabela); ReBAC agora.
- Mudaríamos para ReBAC (OpenFGA) se: equipes, plantões compartilhados e
  delegação entre profissionais virassem relações do dia a dia.

## ADR-05 · Credencial de máquinas e agentes (cap. 15)
- Escolha: chave de API com escopo ⊆ papel e validade de até 90 dias para
  integrações; token delegado com audiência para agentes em nome de
  alguém; nunca a sessão da pessoa.
- Ação de escrita feita por agente pede confirmação humana com a origem.
