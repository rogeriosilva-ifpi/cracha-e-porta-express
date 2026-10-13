// Login e redefinição de senha (capítulo 4).
import type { Express } from "express";
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { autenticada, publica } from "../acesso/politica.js";
import { encerrar, encerrarTodas, iniciar } from "../acesso/sessoes.js";
import {
  HASH_FICTICIO, MAX, hashSenha, motivoDeRecusa,
  precisaRehash, verificarSenha,
} from "../acesso/senhas.js";
import {
  abrirFamilia, girar, revogarFamilia, revogarTodas,
} from "../acesso/refresh.js";
import { ACCESS_S, emitirAccess, jwks } from "../acesso/tokens.js";
import { publico, usuarios, type Usuario } from "../acesso/usuarios.js";
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

/** Confere e-mail e senha (capítulo 4). Toda falha é a mesma. */
async function conferir(corpo: unknown): Promise<Usuario> {
  const { email, senha } = Login.parse(corpo);
  const u = usuarios.porEmail(email);
  if (!u) {
    await verificarSenha(HASH_FICTICIO, senha); // mesmo custo
    throw new UnauthorizedError(FALHA);
  }
  if (!(await verificarSenha(u.passwordHash, senha)))
    throw new UnauthorizedError(FALHA);
  if (precisaRehash(u.passwordHash))
    usuarios.trocarHash(u.id, await hashSenha(senha));
  return u;
}

// Access curto (JWT, carrega a família em sid) + refresh opaco.
const par = async (usuarioId: string, familia: string, refresh: string) => ({
  access_token: await emitirAccess(usuarioId, { sid: familia }),
  token_type: "Bearer", expires_in: ACCESS_S, refresh_token: refresh,
});

export function registrar(app: Express) {
  // Navegador: sessão em cookie (capítulo 5).
  app.post("/api/auth/login", publica(), async (req, res) => {
    const u = await conferir(req.body);
    iniciar(req, res, u.id);
    res.json({ usuario: publico(u) });
  });

  // Clientes de API (app, integrações): token Bearer (capítulo 6).
  app.post("/api/auth/token", publica(), async (req, res) => {
    const u = await conferir(req.body);
    const { familia, refresh } = abrirFamilia(u.id);
    res.json(await par(u.id, familia, refresh));
  });

  // Troca o refresh por um par novo (capítulo 7).
  app.post("/api/auth/refresh", publica(), async (req, res) => {
    const { refresh_token } = z.object({ refresh_token: z.string().max(2000) })
      .parse(req.body);
    const g = girar(refresh_token);
    if (!g) throw new UnauthorizedError();
    res.json(await par(g.usuarioId, g.familia, g.refresh));
  });

  // "Sair de todos os dispositivos".
  app.post("/api/auth/logout-all", autenticada(), (req, res) => {
    encerrarTodas(req.usuario!.id);    // cookies
    revogarTodas(req.usuario!.id);     // apps
    res.status(204).end();
  });

  // Chaves públicas: quem confere nossos tokens busca aqui.
  app.get("/.well-known/jwks.json", publica(), async (_req, res) => {
    res.json(await jwks());
  });

  app.post("/api/auth/logout", autenticada(), (req, res) => {
    if (req.familia) revogarFamilia(req.familia);   // app: só este
    else encerrar(req, res);                        // navegador
    res.status(204).end();
  });

  app.get("/api/auth/me", autenticada(), (req, res) => {
    res.json({ usuario: publico(req.usuario!) });
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
    encerrarTodas(u.id);           // senha nova derruba sessões antigas
    revogarTodas(u.id);            // e os apps conectados
    res.status(204).end();
  });
}
