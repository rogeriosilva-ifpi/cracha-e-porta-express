#!/usr/bin/env python3
"""raiox.py — mostra o que vai dentro de um JWT e aponta riscos.

uso: python raiox.py <token>
     python raiox.py --login URL email senha   (pede um token à API)

Só LÊ o token, como qualquer pessoa pode ler: não confere a assinatura
e não fabrica nada. Serve para revisar o que a sua API emite.
"""
import base64, json, sys, urllib.request

ASSIMETRICOS = {"EdDSA", "Ed25519", "ES256", "ES384", "RS256", "PS256"}
PESSOAIS = {"email", "nome", "name", "cpf", "cns", "telefone", "nascimento",
            "senha", "password", "passwordHash", "password_hash"}


def parte(s):
    return json.loads(base64.urlsafe_b64decode(s + "=" * (-len(s) % 4)))


def ler(token):
    cab, conteudo, _ = token.split(".")
    return parte(cab), parte(conteudo)


def avisos(cab, p):
    alg = cab.get("alg", "?")
    if alg.lower() == "none":
        yield "CRÍTICO", "alg none: token sem assinatura"
    elif alg.startswith("HS"):
        yield "RISCO", f"alg {alg}: quem confere o token também consegue emiti-lo"
    elif alg in ASSIMETRICOS:
        yield "ok", f"alg {alg}: só quem tem a chave privada emite"
    if "kid" not in cab:
        yield "aviso", "sem kid: trocar a chave derruba todos os tokens"
    if "exp" not in p:
        yield "CRÍTICO", "sem exp: o token vale para sempre"
    else:
        ttl = p["exp"] - p.get("iat", p["exp"])
        nivel = "ok" if ttl <= 15 * 60 else "RISCO"
        yield nivel, f"validade de {formatar(ttl)}"
    faltam = [c for c in ("iss", "aud", "jti") if c not in p]
    if faltam:
        yield "RISCO", "sem " + ", ".join(faltam) + ": não dá para saber de quem e para quem"
    pessoais = sorted(PESSOAIS & set(p))
    if pessoais:
        yield "RISCO", "dado pessoal legível por qualquer um: " + ", ".join(pessoais)


def formatar(s):
    if s >= 86400:
        return f"{s // 86400} dias"
    if s >= 3600:
        return f"{s // 3600} h"
    return f"{s // 60} min"


def pedir(url, email, senha):
    corpo = json.dumps({"email": email, "senha": senha}).encode()
    req = urllib.request.Request(url.rstrip("/") + "/api/auth/token", data=corpo,
                                 method="POST", headers={"Content-Type": "application/json"})
    return json.load(urllib.request.urlopen(req, timeout=10))["access_token"]


def main():
    args = sys.argv[1:]
    token = pedir(*args[1:4]) if args[:1] == ["--login"] else args[0]
    cab, p = ler(token)
    print("cabeçalho:", json.dumps(cab, ensure_ascii=False))
    print("conteúdo :", json.dumps(p, ensure_ascii=False))
    print("avisos:")
    for nivel, texto in avisos(cab, p):
        print(f"  {nivel:<8}{texto}")


if __name__ == "__main__":
    main()
