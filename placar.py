#!/usr/bin/env python3
"""placar.py — roda um arquivo .http de ataques e mostra o placar.

uso: python placar.py ataques.http [--base URL] [-v]

Cada bloco começa com "### ID · descrição" e pode ter uma linha
"# @espera status=401|404 sem=texto contem=texto". O ataque é
DEFENDIDO quando
a resposta cumpre todas as expectativas.
"""
import argparse, json, re, sys, urllib.request, urllib.error

def blocos(texto):
    vars_ = dict(re.findall(r"^@(\w+)\s*=\s*(\S+)", texto, re.M))
    for bruto in texto.split("\n###")[1:]:
        linhas = bruto.splitlines()
        titulo = linhas[0].strip(" #")
        ident, _, desc = titulo.partition("·")
        espera, req, i = "", [], 1
        while i < len(linhas) and (linhas[i].startswith("#") or not linhas[i].strip()):
            if linhas[i].startswith("# @espera"):
                espera = linhas[i].split("@espera", 1)[1]
            i += 1
        req = linhas[i:]
        yield ident.strip(), desc.strip(), espera.split(), req, vars_

def montar(req, vars_, base):
    sub = lambda s: re.sub(r"\{\{(\w+)\}\}", lambda m: base if m[1] == "base" else vars_.get(m[1], ""), s)
    metodo, url = req[0].split(maxsplit=1)
    cab, i = {}, 1
    while i < len(req) and req[i].strip():
        k, _, v = req[i].partition(":"); cab[k.strip()] = v.strip(); i += 1
    corpo = "\n".join(req[i:]).strip()
    return metodo, sub(url.strip()), cab, (sub(corpo).encode() if corpo else None)

def enviar(metodo, url, cab, corpo):
    r = urllib.request.Request(url, data=corpo, method=metodo, headers=cab)
    try:
        with urllib.request.urlopen(r, timeout=10) as resp:
            return resp.status, resp.read().decode(errors="replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode(errors="replace")

def avaliar(espera, status, corpo):
    ok = True
    for e in espera:
        chave, _, valor = e.partition("=")
        if chave == "status":
            ok &= str(status) in valor.split("|")
        elif chave == "sem":
            ok &= valor not in corpo
        elif chave == "contem":
            ok &= valor in corpo
    return ok

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("arquivo"); ap.add_argument("--base"); ap.add_argument("-v", action="store_true")
    a = ap.parse_args()
    texto = open(a.arquivo, encoding="utf-8").read()
    print(f"{'ATQ':<8}{'esperado':<12}{'obtido':<8}veredito")
    total = defendidos = 0
    for ident, desc, espera, req, vars_ in blocos(texto):
        base = a.base or vars_.get("base", "")
        status, corpo = enviar(*montar(req, vars_, base))
        ok = avaliar(espera, status, corpo)
        total += 1; defendidos += ok
        esp = next((e.split("=")[1] for e in espera if e.startswith("status=")), "-")
        print(f"{ident.replace('ATQ-',''):<8}{esp:<12}{status:<8}{'defendido' if ok else 'VULNERÁVEL'}")
        if a.v:
            print(f"        {desc}")
    print(f"\nplacar: {defendidos}/{total} defendidos")
    sys.exit(0 if defendidos == total else 1)

if __name__ == "__main__":
    main()
