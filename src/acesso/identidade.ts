// Quem está pedindo? Duas provas aceitas (capítulo 6):
// token Bearer (clientes de API) ou cookie de sessão (navegador).
import type { Request } from "express";
import { identificar as daSessao } from "./sessoes.js";
import { verificarAccess } from "./tokens.js";
import { usuarios, type Usuario } from "./usuarios.js";

export async function identificar(req: Request): Promise<Usuario | undefined> {
  const auth = req.get("Authorization");
  if (auth === undefined) return daSessao(req);
  const [tipo, token] = auth.split(" ");
  if (tipo !== "Bearer" || !token) return undefined;  // sem plano B
  try {
    const { sub } = await verificarAccess(token);
    return usuarios.porId(sub!);       // papel atual vem do banco
  } catch {
    return undefined;                  // inválido, vencido, de outro: 401
  }
}
