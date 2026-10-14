#!/usr/bin/env python3
"""varredura.py — procura segredos em TODO o histórico do git.

uso: python varredura.py [--ignorar .varredura-ignorar]

Lê `git log -p --all` (não só a versão atual: apagar o arquivo não apaga
o segredo do histórico) e acusa chaves privadas e atribuições do tipo
CHAVE=..., SECRET=..., TOKEN=... com valor de alta entropia. Mostra só
o começo do valor e uma impressão digital (sha256), nunca o segredo.
Impressões listadas em .varredura-ignorar (segredos já TROCADOS) não
contam. Sai com 1 se achar algo novo: serve de portão no CI.
"""
import hashlib, math, re, subprocess, sys
from collections import Counter

NOME = re.compile(r"^\+\s*(?:export\s+)?([A-Z0-9_]*(?:SECRET|CHAVE|KEY|TOKEN|SENHA|PASSWORD)[A-Z0-9_]*)\s*[=:]\s*[\"']?([^\s\"']{16,})")
VAR = re.compile(r"^\+\s*(?:export\s+)?([A-Z0-9_]+)\s*[=:]")
PEM = re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----")
# Não é segredo: valor de exemplo, ou expressão de código montada na hora.
FALSO = re.compile(r"troque|changeme|exemplo|example|\$\{|^`|\(\)")


def entropia(s):
    n = len(s)
    return -sum(c / n * math.log2(c / n) for c in Counter(s).values())


def digital(valor):
    return hashlib.sha256(valor.encode()).hexdigest()[:12]


def achados():
    log = subprocess.run(["git", "log", "-p", "--all", "--format=@@ %h %ad", "--date=short"],
                         capture_output=True, text=True, check=True).stdout
    commit = arquivo = None
    for linha in log.splitlines():
        if linha.startswith("@@ ") and not linha.startswith("@@ -"):
            commit = linha[3:]
        elif linha.startswith("+++ b/"):
            arquivo = linha[6:]
        elif linha.startswith("+") and not linha.startswith("+++"):
            m = NOME.match(linha)
            if m and entropia(m.group(2)) > 3.5 and not FALSO.search(m.group(2)):
                yield commit, arquivo, m.group(1), m.group(2)
            elif PEM.search(linha):
                v = VAR.match(linha)
                nome = f"{v.group(1)} (chave privada PEM)" if v else "chave privada (PEM)"
                yield commit, arquivo, nome, linha[linha.index("-----BEGIN"):]


def main():
    caminho = sys.argv[sys.argv.index("--ignorar") + 1] if "--ignorar" in sys.argv else ".varredura-ignorar"
    try:
        ignorar = {l.split()[0] for l in open(caminho) if l.strip() and not l.startswith("#")}
    except FileNotFoundError:
        ignorar = set()
    novos = trocados = 0
    for commit, arquivo, nome, valor in achados():
        d = digital(valor)
        if d in ignorar:
            trocados += 1
            continue
        novos += 1
        print(f"{commit}  {arquivo}\n    {nome}\n    = {valor[:4]}…  (digital {d})")
    print(f"\n{novos} segredo(s) no histórico · {trocados} já trocado(s) e ignorado(s)")
    sys.exit(1 if novos else 0)


if __name__ == "__main__":
    main()
