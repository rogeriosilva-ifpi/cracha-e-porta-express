#!/usr/bin/env python3
"""cronometro.py — o tempo de resposta do login denuncia quem existe?

uso: python cronometro.py [--base URL] [-n 200]

Alterna logins com SENHA ERRADA para um e-mail que existe e para um
que não existe, e compara as medianas. Diferença acima de 5% é um
canal de enumeração de usuários.
"""
import argparse, json, statistics, time, urllib.error, urllib.request


def login(base, email):
    corpo = json.dumps({"email": email, "senha": "senha-errada-de-proposito"}).encode()
    req = urllib.request.Request(base + "/api/auth/login", data=corpo, method="POST",
                                 headers={"Content-Type": "application/json"})
    t0 = time.perf_counter()
    try:
        urllib.request.urlopen(req, timeout=10).read()
    except urllib.error.HTTPError as e:
        e.read()
    return (time.perf_counter() - t0) * 1000


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://localhost:3000")
    ap.add_argument("-n", type=int, default=200)
    a = ap.parse_args()
    login(a.base, "aquecimento@hospital.dev")
    existe, nao = [], []
    for _ in range(a.n):
        existe.append(login(a.base, "ana@hospital.dev"))
        nao.append(login(a.base, "ninguem@hospital.dev"))
    m1, m2 = statistics.median(existe), statistics.median(nao)
    dif = abs(m1 - m2) / max(m1, m2) * 100
    fmt = lambda v: f"{v:6.1f}".replace(".", ",")
    print(f"cronometro · {a.n} amostras por grupo")
    print(f"e-mail existente   : mediana {fmt(m1)} ms")
    print(f"e-mail inexistente : mediana {fmt(m2)} ms")
    veredito = "indistinguível" if dif < 5 else "o tempo denuncia"
    print(f"diferença          : {dif:.0f}% ({veredito})")


if __name__ == "__main__":
    main()
