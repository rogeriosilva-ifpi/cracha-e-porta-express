#!/usr/bin/env python3
"""regua.py — a régua do sênior com evidência (capítulo 16).

uso: python regua.py [REGUA.md] [-v]

Cada item marcado ([x]) só conta se trouxer evidência que existe:
  ATQ-06.4             ataque em ataques.http
  SEC-14               invariante em INVARIANTES.md
  caminho              arquivo do repositório
  caminho::trecho      arquivo que contém o trecho (nome de teste,
                       seção, regra)
SEC sozinho não basta: regra escrita não é prova. O item precisa de
ao menos um ataque ou arquivo. Marcar sem evidência não conta.
"""
import re
import sys
from pathlib import Path

LINHA = re.compile(r"^- \[([ xX])\] (\d\d) (.+?)(?: — (.+))?$")
META = 30


def conferir(ev: str, raiz: Path) -> str | None:
    """Devolve o problema, ou None se a evidência existe."""
    if re.fullmatch(r"ATQ-\d\d\.\d+", ev):
        alvo = raiz / "ataques.http"
        ok = alvo.exists() and re.search(rf"^### {re.escape(ev)} ", alvo.read_text(), re.M)
        return None if ok else f"{ev} não está em ataques.http"
    if re.fullmatch(r"SEC-\d\d", ev):
        alvo = raiz / "INVARIANTES.md"
        ok = alvo.exists() and f"**{ev}**" in alvo.read_text()
        return None if ok else f"{ev} não está em INVARIANTES.md"
    caminho, _, trecho = ev.partition("::")
    alvo = raiz / caminho
    if not alvo.is_file():
        return f"{caminho} não existe"
    if trecho and trecho not in alvo.read_text(errors="replace"):
        return f"{caminho} não contém “{trecho}”"
    return None


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    arquivo = Path(args[0] if args else "REGUA.md")
    raiz = arquivo.resolve().parent
    grupos, grupo, problemas = {}, "?", []
    for l in arquivo.read_text(encoding="utf-8").splitlines():
        if l.startswith("## "):
            grupo = l[3:].strip()
            grupos.setdefault(grupo, [0, 0])
            continue
        m = LINHA.match(l)
        if not m:
            continue
        marcado, num, _, evs = m.groups()
        grupos[grupo][1] += 1
        if marcado == " ":
            continue
        evid = [e.strip() for e in (evs or "").split("·") if e.strip()]
        erros = [p for e in evid if (p := conferir(e, raiz))]
        if not any(not e.startswith("SEC-") for e in evid):
            erros.append("só regra escrita, sem prova")
        if erros:
            problemas += [f"✗ {num} {p}" for p in erros]
        else:
            grupos[grupo][0] += 1
    total = sum(t for _, t in grupos.values())
    feitos = sum(f for f, _ in grupos.values())
    print(f"régua do sênior · {raiz.name}")
    for g, (f, t) in grupos.items():
        print(f"  {g[:28]:<28}{f:>3}/{t}")
    print(f"\ncom evidência {feitos:>3}/{total} · {100 * feitos // max(total, 1):>3}%")
    print(f"meta do livro {META:>3}/{total} · {100 * META // max(total, 1):>3}%")
    if problemas:
        print()
        for p in problemas if "-v" in sys.argv else problemas[:8]:
            print(p)
        if len(problemas) > 8 and "-v" not in sys.argv:
            print(f"… mais {len(problemas) - 8} (use -v)")
    sys.exit(0 if feitos >= META else 1)


if __name__ == "__main__":
    main()
