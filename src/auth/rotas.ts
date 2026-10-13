// Login e redefinição de senha (capítulo 4).
import type { Express } from "express";
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { publica } from "../acesso/politica.js";
import {
  HASH_FICTICIO, MAX, hashSenha, motivoDeRecusa,
  precisaRehash, verificarSenha,
} from "../acesso/senhas.js";
import { publico, usuarios } from "../acesso/usuarios.js";
import { banco } from "../compartilhado/banco.js";
import { BadRequestError, UnauthorizedError } from "../compartilhado/erros.js";

const Login = z.object({
  email: z.string().max(254),
  senha: z.string().max(MAX),
});
const FALHA = "Credenciais inválidas.";   // a mesma para todo erro
const VALIDADE_MS = 15 * 60 * 1000;       // token de redefinição: 15 min
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/** Caixa de saída simulada: o "e-mail" que levaria o link. */
export const caixaDeSaida: { para: string; token: string }[] = [];

export function registrar(app: Express) {
  app.post("/api/auth/login", publica(), async (req, res) => {
    const { email, senha } = Login.parse(req.body);
    const u = usuarios.porEmail(email);
    if (!u) {
      await verificarSenha(HASH_FICTICIO, senha); // mesmo custo
      throw new UnauthorizedError(FALHA);
    }
    if (!(await verificarSenha(u.passwordHash, senha)))
      throw new UnauthorizedError(FALHA);
    if (precisaRehash(u.passwordHash))
      usuarios.trocarHash(u.id, await hashSenha(senha));
    res.json({ usuario: publico(u) });
  });

  app.post("/api/auth/reset/solicitar", publica(), (req, res) => {
    const { email } = z.object({ email: z.string().max(254) }).parse(req.body);
    const u = usuarios.porEmail(email);
    if (u) {
      const token = randomBytes(32).toString("base64url");
      banco.prepare(`INSERT INTO redefinicoes (token_hash, usuario_id, expira_em)
                     VALUES (?, ?, ?)`)
        .run(sha256(token), u.id, Date.now() + VALIDADE_MS);
      caixaDeSaida.push({ para: u.email, token });
    }
    // Mesma resposta exista ou não o e-mail.
    res.status(202).json({ mensagem: "Se o e-mail existir, enviaremos instruções." });
  });

  app.post("/api/auth/reset/confirmar", publica(), async (req, res) => {
    const { token, novaSenha } = z.object({
      token: z.string().max(100), novaSenha: z.string().max(MAX),
    }).parse(req.body);
    const r = banco.prepare(`SELECT * FROM redefinicoes WHERE token_hash = ?`)
      .get(sha256(token)) as
      { usuario_id: string; expira_em: number; usado: number } | undefined;
    if (!r || r.usado || r.expira_em < Date.now())
      throw new BadRequestError("Código inválido ou expirado.");
    const u = usuarios.porId(r.usuario_id)!;
    const motivo = motivoDeRecusa(novaSenha, u.email);
    if (motivo) throw new BadRequestError(motivo);
    banco.prepare("UPDATE redefinicoes SET usado = 1 WHERE token_hash = ?")
      .run(sha256(token));
    usuarios.trocarHash(u.id, await hashSenha(novaSenha));
    res.status(204).end();
  });
}
