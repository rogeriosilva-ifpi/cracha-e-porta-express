// Quem está pedindo? Três provas aceitas (capítulos 6, 7 e 15):
// token Bearer (apps), chave de API (máquinas e agentes) ou cookie de
// sessão (navegador). Cada uma pelo seu esquema; sem plano B.
import type { Request } from "express";
import { verificarChave } from "./chaves.js";
import type { Permissao } from "./permissoes.js";
import { familiaAtiva } from "./refresh.js";
import { identificar as daSessao } from "./sessoes.js";
import { verificarAccess } from "./tokens.js";
import { usuarios, type Usuario } from "./usuarios.js";

declare global {
  namespace Express {
    interface Request {
      familia?: string;
      chave?: { id: string; escopos: Permissao[] };  // só quando veio por chave
    }
  }
}

export async function identificar(req: Request): Promise<Usuario | undefined> {
  const auth = req.get("Authorization");
  if (auth === undefined) return daSessao(req);
  const [tipo, credencial, sobra] = auth.split(" ");
  if (!credencial || sobra !== undefined) return undefined;
  if (tipo === "ApiKey") {
    const k = verificarChave(credencial);
    if (!k) return undefined;
    req.chave = { id: k.id, escopos: k.escopos };
    return usuarios.porId(k.usuarioId);   // papel de HOJE, não o da criação
  }
  if (tipo !== "Bearer") return undefined;
  try {
    const { sub, sid } = await verificarAccess(credencial);
    // Nossa API também confere se a família não foi revogada.
    const f = typeof sid === "string" ? familiaAtiva(sid) : undefined;
    if (!f || f.usuario_id !== sub) return undefined;
    req.familia = sid as string;
    return usuarios.porId(sub!);       // papel atual vem do banco
  } catch {
    return undefined;                  // inválido, vencido, de outro: 401
  }
}
