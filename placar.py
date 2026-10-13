#!/usr/bin/env python3
"""placar.py — roda um arquivo .http de ataques e mostra o placar.

uso: python placar.py ataques.http [--base URL] [-v]

Cada bloco começa com "### ID · descrição" e pode ter uma linha
"# @espera status=401|404 status!=403 sem=texto contem=texto cab=Nome~texto".
"# @sessao nome" guarda e reenvia os cookies daquela sessão;
"# @guarda var=campo" guarda um campo do JSON da resposta em {{var}}.
Expectativas jwt-* leem o access_token da resposta (sem conferir
assinatura): jwt-alg=EdDSA, jwt-tem=iss,aud, jwt-sem=email, jwt-ttl<=900.
Blocos sem @espera são preparação e não contam. O ataque é DEFENDIDO
quando a resposta cumpre todas as expectativas.
"""
import argparse, base64, copy, json, re, sys, urllib.request, urllib.error

GUARDADOS = {}  # @guarda: valores tirados das respostas

def blocos(texto):
    vars_ = dict(re.findall(r"^@(\w+)\s*=\s*(\S+)", texto, re.M))
    for bruto in texto.split("\n###")[1:]:
        linhas = bruto.splitlines()
        titulo = linhas[0].strip(" #")
        ident, _, desc = titulo.partition("·")
        espera, diretivas, i = None, {}, 1
        while i < len(linhas) and (linhas[i].startswith("#") or not linhas[i].strip()):
            m = re.match(r"# @(\w+)\s*(.*)", linhas[i])
            if m and m[1] == "espera":
                espera = m[2].split()
            elif m:
                diretivas[m[1]] = m[2].strip()
            i += 1
        yield ident.strip(), desc.strip(), espera, diretivas, linhas[i:], vars_

def montar(req, vars_, base):
    todas = {**vars_, **GUARDADOS}
    sub = lambda s: re.sub(r"\{\{(\w+)\}\}", lambda m: base if m[1] == "base" else todas.get(m[1], ""), s)
    metodo, url = req[0].split(maxsplit=1)
    cab, i = {}, 1
    while i < len(req) and req[i].strip():
        k, _, v = req[i].partition(":"); cab[k.strip()] = sub(v.strip()); i += 1
    resto = req[i:]
    while resto and (not resto[-1].strip() or resto[-1].lstrip().startswith("#")):
        resto = resto[:-1]  # comentários e linhas vazias no fim não são corpo
    corpo = "\n".join(resto).strip()
    return metodo, sub(url.strip()), cab, (sub(corpo).encode() if corpo else None)

JARRAS = {}  # sessão nomeada -> {cookie: valor}


def enviar(metodo, url, cab, corpo, sessao=None):
    if sessao and JARRAS.get(sessao):
        cab = {**cab, "Cookie": "; ".join(f"{k}={v}" for k, v in JARRAS[sessao].items())}
    r = urllib.request.Request(url, data=corpo, method=metodo, headers=cab)
    try:
        resp = urllib.request.urlopen(r, timeout=10)
    except urllib.error.HTTPError as e:
        resp = e
    status, texto = resp.status if hasattr(resp, "status") else resp.code, resp.read().decode(errors="replace")
    cookies = resp.headers.get_all("Set-Cookie") or []
    if sessao is not None:
        jarra = JARRAS.setdefault(sessao, {})
        for c in cookies:
            nome, _, resto = c.partition("=")
            valor = resto.split(";")[0]
            if re.search(r"max-age=0|expires=thu, 01 jan 1970", c, re.I):
                jarra.pop(nome, None)
            else:
                jarra[nome] = valor
    return status, texto, {"set-cookie": " | ".join(cookies)}

def jwt_da_resposta(corpo):
    try:
        cab, conteudo, _ = json.loads(corpo)["access_token"].split(".")
        ler = lambda s: json.loads(base64.urlsafe_b64decode(s + "=" * (-len(s) % 4)))
        return ler(cab), ler(conteudo)
    except Exception:
        return {}, {}


def avaliar(espera, status, corpo, cabecalhos):
    ok = True
    jcab, jcont = jwt_da_resposta(corpo) if any(e.startswith("jwt-") for e in espera) else ({}, {})
    for e in espera:
        chave, _, valor = e.partition("=")
        if chave == "status":
            ok &= str(status) in valor.split("|")
        elif chave == "status!":          # status!=401|403: qualquer um, menos esses
            ok &= str(status) not in valor.split("|")
        elif chave == "sem":
            ok &= valor not in corpo
        elif chave == "contem":
            ok &= valor in corpo
        elif chave == "cab":  # cab=Nome~texto (contém) ou cab=Nome!~texto (não contém)
            nome, nega, alvo = re.match(r"([\w-]+)(!?)~(.*)", valor).groups()
            presente = alvo.lower() in cabecalhos.get(nome.lower(), "").lower()
            ok &= (not presente) if nega else presente
        elif chave == "jwt-alg":
            ok &= jcab.get("alg") == valor
        elif chave == "jwt-tem":
            ok &= all(c in jcont for c in valor.split(","))
        elif chave == "jwt-sem":
            ok &= bool(jcont) and all(c not in jcont for c in valor.split(","))
        elif chave == "jwt-ttl<":
            ok &= "exp" in jcont and jcont["exp"] - jcont.get("iat", 0) <= int(valor)
    return ok

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("arquivo"); ap.add_argument("--base"); ap.add_argument("-v", action="store_true")
    a = ap.parse_args()
    texto = open(a.arquivo, encoding="utf-8").read()
    print(f"{'ATQ':<8}{'esperado':<12}{'obtido':<8}veredito")
    total = defendidos = 0
    for ident, desc, espera, diretivas, req, vars_ in blocos(texto):
        base = a.base or vars_.get("base", "")
        if "clona" in diretivas:  # @clona origem destino
            origem, destino = diretivas["clona"].split()
            JARRAS[destino] = copy.deepcopy(JARRAS.get(origem, {}))
        status, corpo, cabs = enviar(*montar(req, vars_, base), sessao=diretivas.get("sessao"))
        if "guarda" in diretivas:  # @guarda var=campo var2=campo2
            try:
                dados = json.loads(corpo)
            except ValueError:
                dados = {}
            for par in diretivas["guarda"].split():
                var, _, campo = par.partition("=")
                GUARDADOS[var] = str(dados.get(campo, ""))
        if espera is None:  # bloco de preparação (login etc.): não conta
            continue
        ok = avaliar(espera, status, corpo, cabs)
        total += 1; defendidos += ok
        esp = next((e.split("=")[1] for e in espera if e.startswith("status=")),
                   next(("≠" + e.split("=")[1] for e in espera if e.startswith("status!=")), "-"))
        print(f"{ident.replace('ATQ-',''):<8}{esp:<12}{status:<8}{'defendido' if ok else 'VULNERÁVEL'}")
        if a.v:
            print(f"        {desc}")
    print(f"\nplacar: {defendidos}/{total} defendidos")
    sys.exit(0 if defendidos == total else 1)

if __name__ == "__main__":
    main()
