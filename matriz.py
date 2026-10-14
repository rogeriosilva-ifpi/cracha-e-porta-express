#!/usr/bin/env python3
"""matriz.py — gera a suíte papel × rota a partir da matriz de permissões.

uso: npx tsx scripts/censo.ts --json > rotas.json        (Express)
     uv run python scripts/censo.py --json > rotas.json  (FastAPI)
     python matriz.py rotas.json docs/PERMISSOES.md > matriz.http
     python placar.py matriz.http

Para cada rota que exige uma permissão e cada papel: se a matriz dá a
permissão, o papel não pode ser barrado no portão 2 (nem 401, nem a
recusa "Permissão insuficiente."); se não dá, TEM de receber essa
recusa. O portão 3 (regras do objeto, cap. 12) tem testes próprios.
"""
import json, re, sys

CONTAS = {  # um usuário de laboratório por papel (Eva tem MFA: fica fora)
    "recepcao": ("carla@hospital.dev", "rede-na-varanda-de-tarde"),
    "profissional": ("ana@hospital.dev", "cajueiro-em-flor-no-quintal"),
    "admin": ("admin@hospital.dev", "farol-de-amarracao-2026"),
}
EXEMPLO = {"patients": "p1", "encounters": "e1", "users": "u3"}  # ids de exemplo


def ler_matriz(md):
    papeis, regras = [], {}
    for linha in open(md, encoding="utf-8"):
        cel = [c.strip() for c in linha.strip().strip("|").split("|")]
        if cel and cel[0] == "Permissão":
            papeis = cel[1:]
        elif cel and cel[0].startswith("`"):
            regras[cel[0].strip("`")] = {p for p, v in zip(papeis, cel[1:]) if "✅" in v}
    return regras


def caminho_de_exemplo(caminho):
    partes = caminho.split("/")
    for i, p in enumerate(partes):
        if p.startswith(":") or p.startswith("{"):
            partes[i] = EXEMPLO.get(partes[i - 1], "x1")
    return "/".join(partes)


def main():
    rotas = json.load(open(sys.argv[1], encoding="utf-8"))
    regras = ler_matriz(sys.argv[2])
    print("# matriz.http — GERADO por matriz.py. Não edite à mão.")
    print("@base = http://localhost:3000\n")
    for papel, (email, senha) in CONTAS.items():
        print(f"### PREPARAÇÃO · login {papel}\n# @sessao m-{papel}\nPOST {{{{base}}}}/api/auth/login")
        print("Content-Type: application/json\n")
        print(json.dumps({"email": email, "senha": senha}) + "\n")
    n = 0
    for papel in CONTAS:                       # admin por último
        for r in rotas:
            perm = (r.get("politica") or {}).get("permissao")
            if not perm:
                continue
            n += 1
            pode = papel in regras.get(perm, set())
            espera = ("status!=401 sem=Permissão" if pode
                      else "status=403 contem=Permissão")
            print(f"### MTZ-{n:02d} · {papel} {'pode' if pode else 'não pode'} {r['metodo']} {r['caminho']} ({perm})")
            print(f"# @espera {espera}\n# @sessao m-{papel}")
            print(f"{r['metodo']} {{{{base}}}}{caminho_de_exemplo(r['caminho'])}")
            if r["metodo"] in ("POST", "PUT", "PATCH"):
                print("Content-Type: application/json\n\n{}")
            print()


if __name__ == "__main__":
    main()
