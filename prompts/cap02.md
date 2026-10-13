# Capítulo 2 · Criptografia sem medo — prompts complementares

## Chat · C-P-T-R-F-A

```
C  Node 22 + TypeScript (ou Python 3.12+). Só biblioteca padrão:
   node:crypto (ou secrets, hashlib, hmac).
P  Dev sênior de backend com foco em segurança.
T  Escreva gerarCodigoConvite(): string, um código de convite de uso
   único para cadastrar profissionais.
R  Use gerador criptográfico (randomBytes / secrets), nunca
   Math.random ou random. Pelo menos 32 bytes de entropia. Formato
   base64url. Sem bibliotecas externas.
F  Só a função e um teste, comentados em português.
A  Dois códigos gerados em sequência nunca são iguais; o teste roda.
```

## Revisão · contexto novo

```
Procure no repositório, com grep, todo uso de Math.random, random.,
md5, sha1, sha256 aplicado a senha, comparação de segredo com == ou
===, e Buffer/base64 tratado como proteção. Para cada ocorrência:
arquivo:linha, por que é risco e a ferramenta certa do capítulo 2.
Não altere arquivos.
```
