// Sessões no servidor, identificadas por um cookie (capítulo 5).
import type { CookieOptions, Request, Response } from "express";
import { createHash, randomBytes } from "node:crypto";
import { parseCookie } from "cookie";
import { banco } from "../compartilhado/banco.js";
import { usuarios, type Usuario } from "./usuarios.js";

export const COOKIE = "__Host-sessao";        // exige Secure e Path=/
export const OCIOSA_MS = 30 * 60 * 1000;      // 30 min sem uso
export const ABSOLUTA_MS = 8 * 60 * 60 * 1000; // um plantão
const OPCOES: CookieOptions = {
  httpOnly: true,   // JavaScript da página não lê
  secure: true,     // só viaja em HTTPS
  sameSite: "lax",  // não vai em POST vindo de outro site
  path: "/",
};
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const tokenDe = (req: Request) => parseCookie(req.headers.cookie ?? "")[COOKIE];
const apagar = (token: string) =>
  banco.prepare("DELETE FROM sessoes WHERE id_hash = ?").run(sha256(token));

type Sessao = { usuario_id: string; ultimo_uso: number; expira_em: number };

export function identificar(req: Request): Usuario | undefined {
  const token = tokenDe(req);
  if (!token) return undefined;
  const s = banco.prepare("SELECT * FROM sessoes WHERE id_hash = ?")
    .get(sha256(token)) as Sessao | undefined;
  if (!s) return undefined;
  const agora = Date.now();
  if (agora - s.ultimo_uso > OCIOSA_MS || agora > s.expira_em) {
    apagar(token);                       // expirou: some do servidor
    return undefined;
  }
  banco.prepare("UPDATE sessoes SET ultimo_uso = ? WHERE id_hash = ?")
    .run(agora, sha256(token));
  return usuarios.porId(s.usuario_id);
}

export function iniciar(req: Request, res: Response, usuarioId: string) {
  const anterior = tokenDe(req);
  if (anterior) apagar(anterior);        // nunca reaproveita (fixação)
  const token = randomBytes(32).toString("base64url");
  const agora = Date.now();
  banco.prepare(`INSERT INTO sessoes VALUES (?, ?, ?, ?, ?)`)
    .run(sha256(token), usuarioId, agora, agora, agora + ABSOLUTA_MS);
  res.cookie(COOKIE, token, { ...OPCOES, maxAge: ABSOLUTA_MS });
}

export function encerrar(req: Request, res: Response) {
  const token = tokenDe(req);
  if (token) apagar(token);              // logout de verdade: no servidor
  res.clearCookie(COOKIE, OPCOES);
}

/** Derruba todas as sessões de alguém (troca de senha, desligamento). */
export function encerrarTodas(usuarioId: string) {
  banco.prepare("DELETE FROM sessoes WHERE usuario_id = ?").run(usuarioId);
}
