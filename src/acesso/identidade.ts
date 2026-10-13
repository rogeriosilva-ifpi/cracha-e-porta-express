// Quem está pedindo? VERSÃO INGÊNUA (tag cap06-antes).
import type { Request } from "express";
import { identificar as daSessao } from "./sessoes.js";
import { verificarAccess } from "./tokens.js";
import { usuarios } from "./usuarios.js";

export async function identificar(req: Request) {
  const auth = req.get("Authorization");
  if (auth?.startsWith("Bearer ")) {
    const p = await verificarAccess(auth.slice(7));
    return usuarios.porId(String(p.sub));
  }
  return daSessao(req);
}
