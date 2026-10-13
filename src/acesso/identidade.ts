// Quem está pedindo? Duas provas aceitas (capítulos 6 e 7):
// token Bearer (clientes de API) ou cookie de sessão (navegador).
import type { Request } from "express";
import { familiaAtiva } from "./refresh.js";
import { identificar as daSessao } from "./sessoes.js";
import { verificarAccess } from "./tokens.js";
import { usuarios, type Usuario } from "./usuarios.js";

declare global {
  namespace Express { interface Request { familia?: string } }
}

export async function identificar(req: Request): Promise<Usuario | undefined> {
  const auth = req.get("Authorization");
  if (auth === undefined) return daSessao(req);
  const [tipo, token] = auth.split(" ");
  if (tipo !== "Bearer" || !token) return undefined;  // sem plano B
  try {
    const { sub, sid } = await verificarAccess(token);
    // Nossa API também confere se a família não foi revogada.
    const f = typeof sid === "string" ? familiaAtiva(sid) : undefined;
    if (!f || f.usuario_id !== sub) return undefined;
    req.familia = sid as string;
    return usuarios.porId(sub!);       // papel atual vem do banco
  } catch {
    return undefined;                  // inválido, vencido, de outro: 401
  }
}
