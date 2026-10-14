#!/usr/bin/env bash
# portoes.sh — os portões de segurança do Mini-Prontuário (capítulo 14).
# O CI roda exatamente isto; rode também antes de abrir um PR.
# Cada portão que falha derruba o conjunto (código de saída 1).
set -u
PORTA=${PORTA:-3999}
falhas=0
export LC_ALL=C.UTF-8
resumo() {                      # a linha que interessa, curta
  local r
  r=$(echo "$1" | grep -E "Tests |placar:|rotas ·|segredo|vulnerabilit|error|passed|failed" | tail -1)
  r=${r:-sem erros}
  r=$(echo "$r" | sed -E 's/^ +//; s/ · [0-9]+ já.*//; s/ no histórico//; s/ defendidos//;
      s/^Tests +//; s/ \([0-9]+\)$//; s/ in [0-9.]+s$//; s/^=+ | =+$//g;
      s/^found 0 vulnerabilities$|^No known vulnerabilities found.*/0 vulnerabilidades/;
      s/ 1 problema\(s\)/ 1 problema/; s/problema\(s\)/problemas/;
      s/^1 segredo\(s\)/1 segredo/; s/segredo\(s\)/segredos/')
  echo "${r:0:24}"
}
portao() {                      # portao "nome" comando...
  local nome=$1; shift
  local pad; pad=$(printf '%*s' $((13 - ${#nome})) '')   # conta letras, não bytes
  if saida=$("$@" 2>&1); then
    echo "ok     $nome$pad$(resumo "$saida")"
  else
    echo "FALHOU $nome$pad$(resumo "$saida")"
    falhas=$((falhas + 1))
  fi
}
servidor_e() {                  # sobe o servidor, roda o comando, derruba
  PORT=$PORTA setsid npx tsx src/server.ts > /tmp/portoes-servidor.log 2>&1 &
  local pid=$!                  # setsid: o servidor e seus filhos num grupo só
  for _ in $(seq 1 40); do curl -s -o /dev/null "localhost:$PORTA/health" && break; sleep 0.25; done
  "$@"; local r=$?
  kill -- -$pid 2>/dev/null; wait $pid 2>/dev/null   # derruba o grupo inteiro
  return $r
}
ataques() { sed "s#^@base = .*#@base = http://localhost:$PORTA#" "$1" > /tmp/portoes.http
            python3 placar.py /tmp/portoes.http; }
matriz() { npx tsx scripts/censo.ts --json > /tmp/rotas.json &&
           python3 matriz.py /tmp/rotas.json docs/PERMISSOES.md > /tmp/matriz.http &&
           ataques /tmp/matriz.http; }

echo "portões de segurança · prontuario-express"
portao "tipos"        npm run --silent check
portao "testes"       npx vitest run --reporter=dot
portao "censo"        npx tsx scripts/censo.ts
portao "segredos"     python3 varredura.py
portao "dependências" npm audit --omit=dev
portao "ataques"      servidor_e ataques ataques.http
portao "papel × rota" servidor_e matriz
echo
[ $falhas -eq 0 ] && echo "os 7 portões passaram" || echo "$falhas de 7 portões falharam"
exit $(( falhas > 0 ))
