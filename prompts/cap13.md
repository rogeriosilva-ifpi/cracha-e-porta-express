# Capítulo 13 · Segredos, chaves e cadeia de suprimentos — prompts complementares

## Agente · versão FastAPI

```
Goal
Segredos só do ambiente, com falha cedo em produção; segredo TOTP
cifrado em repouso; chave do JWT vinda do ambiente.

Context
@src/prontuario/compartilhado/ @src/prontuario/acesso/ @INVARIANTES.md
FastAPI, cryptography (já instalado com o PyJWT).

Constraints
- carregar_config(env): produção sem CORS_ORIGINS, CHAVE_JWT_ATUAL ou
  CHAVE_DADOS, ou com valor de exemplo: ValueError com a lista, sem
  mostrar valores; sys.exit(1) no import
- Cofre AES-GCM: "versao:base64(iv|cifra|tag)"; anterior só decifra
- mfa: grava cofre.cifrar(segredo), lê cofre.decifrar(...)
- chave_do_pem: kid = thumbprint RFC 7638
- .gitignore com .env* e !.env.exemplo; nenhuma dependência nova

Done when
- uv run pytest verde; varredura.py sem segredo novo
- AMBIENTE=producao sem variáveis: o servidor não sobe
```

## Chat · C-P-T-R-F-A

```
C  Um .env com chaves foi commitado há 3 semanas e apagado depois.
   O repositório é privado, com 12 pessoas com acesso.
P  Engenheiro de segurança responsável por resposta a incidentes.
T  Liste, em ordem, o que fazer agora.
R  Considere que o segredo pode ter sido copiado; diga o que trocar,
   como invalidar o que foi emitido com ele e o que reescrever no git
   (e por que isso vem depois).
F  Lista numerada curta + o que registrar no incidente.
A  Trocar o segredo vem antes de mexer no histórico.
```

## Revisão · contexto novo

```
Revise o repositório contra INVARIANTES.md (SEC-33 a SEC-35). Rode
python varredura.py, npm audit / pip-audit e grep por "SECRET",
"CHAVE", "KEY", "PRIVATE KEY". Procure: segredo com valor padrão no
código, .gitignore que deixa passar .env.producao, config que sobe em
produção sem segredo, dado sensível em texto no banco, dependência
nova sem justificativa. Para cada achado: arquivo:linha e a correção.
```
