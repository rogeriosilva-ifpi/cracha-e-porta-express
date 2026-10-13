// Os mesmos 7 casos contra quatro modelos de acesso (capítulo 10).
// npx tsx laboratorio/modelos.ts
import { readFileSync } from "node:fs";
import { abac, rbac, rbacComPosse, type Modelo } from "../src/acesso/decisao.js";
import { autorizarCedar } from "../src/acesso/cedar.js";

const casos = JSON.parse(readFileSync("politicas/casos.json", "utf8"));
const modelos: [string, Modelo][] = [
  ["RBAC", rbac], ["+posse", rbacComPosse], ["ABAC", abac], ["Cedar", autorizarCedar],
];
console.log("caso".padEnd(22) + modelos.map(([n]) => n.padEnd(7)).join(""));
const erros = Object.fromEntries(modelos.map(([n]) => [n, 0]));
for (const c of casos) {
  const linha = modelos.map(([n, m]) => {
    const certo = (m(c.sujeito, c.recurso, c.contexto).permitido ? "permitido" : "negado") === c.esperado;
    if (!certo) erros[n] = (erros[n] ?? 0) + 1;
    return (certo ? "ok" : "ERRO").padEnd(7);
  }).join("");
  console.log(c.rotulo.padEnd(22) + linha);
}
console.log("\nerros".padEnd(23) + modelos.map(([n]) => String(erros[n]).padEnd(7)).join(""));
