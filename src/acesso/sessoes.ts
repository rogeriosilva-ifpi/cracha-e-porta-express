// Sessões. VERSÃO INGÊNUA (tag cap05-antes): veja o capítulo 5.
import type { Request, Response } from "express";
import { randomBytes } from "node:crypto";
import { parseCookie } from "cookie";
import { usuarios, type Usuario } from "./usuarios.js";

const sessoes = new Map<string, string>(); // id -> usuarioId

export function identificar(req: Request): Usuario | undefined {
  const id = parseCookie(req.headers.cookie ?? "").sessao;
  const uid = id ? sessoes.get(id) : undefined;
  return uid ? usuarios.porId(uid) : undefined;
}

export function iniciar(req: Request, res: Response, usuarioId: string) {
  const id = parseCookie(req.headers.cookie ?? "").sessao
    ?? randomBytes(16).toString("hex");
  sessoes.set(id, usuarioId);
  res.cookie("sessao", id, { path: "/" });
}

export function encerrar(_req: Request, res: Response) {
  res.clearCookie("sessao", { path: "/" });
}
