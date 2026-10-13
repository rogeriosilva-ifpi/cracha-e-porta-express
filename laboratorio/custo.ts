// laboratorio/custo.ts — quanto custa um palpite? (capítulo 4)
// uso: npx tsx laboratorio/custo.ts
import argon2 from "argon2";
import { createHash } from "node:crypto";
import { PARAMS } from "../src/acesso/senhas.js";

const porSegundo = async (n: number, f: (i: number) => unknown) => {
  const t0 = performance.now();
  for (let i = 0; i < n; i++) await f(i);
  return n / ((performance.now() - t0) / 1000);
};
const fmt = (v: number) => Math.round(v).toLocaleString("pt-BR");

const sha = await porSegundo(200_000, (i) =>
  createHash("sha256").update("senha" + i).digest());
const a2 = await porSegundo(20, (i) => argon2.hash("senha" + i, PARAMS));

console.log("palpites por segundo, 1 núcleo:");
console.log("sha256   :", fmt(sha).padStart(9));
console.log("argon2id :", fmt(a2).padStart(9));
console.log("razão    :", fmt(sha / a2).padStart(9), "× mais caro");
