// Login e redefinição de senha (capítulo 4).
import type { Express, Request } from "express";
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
import {
  abrirDesafio, ativar, iniciarCadastro, mfaAtivo, resolverDesafio,
} from "../acesso/mfa.js";
import { publico, usuarios, type Usuario } from "../acesso/usuarios.js";
import { banco } from "../compartilhado/banco.js";
import {
  BadRequestError, TooManyRequestsError, UnauthorizedError,
} from "../compartilhado/erros.js";
import { contaAnonima, registrar as evento } from "../compartilhado/eventos.js";
import { bloqueio, limparFalhas, porIp, registrarFalha } from "../acesso/limites.js";

const Login = z.object({
  email: z.string().max(254),
  senha: z.string().max(MAX),
});
const FALHA = "Credenciais inválidas.";   // a mesma para todo erro
const VALIDADE_MS = 15 * 60 * 1000;       // token de redefinição: 15 min
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/** Caixa de saída simulada: o "e-mail" que levaria o link. */
export const caixaDeSaida: { para: string; token: string }[] = [];

/** Confere e-mail e senha (capítulos 4 e 9). Toda falha é a mesma. */
async function conferir(req: Request): Promise<Usuario> {
  const { email, senha } = Login.parse(req.body);
  const ip = req.ip;
  const espera = bloqueio(email, req);      // antes de gastar argon2
  if (espera) {
    evento("conta_limitada", { conta: contaAnonima(email), ip });
    throw new TooManyRequestsError(espera);
  }
  const u = usuarios.porEmail(email);
  const ok = u ? await verificarSenha(u.passwordHash, senha)
               : (await verificarSenha(HASH_FICTICIO, senha), false); // mesmo custo
  if (!u || !ok) {
    registrarFalha(email, req);
    evento("login_falhou", { usuario: u?.id, conta: contaAnonima(email), ip });
    throw new UnauthorizedError(FALHA);
  }
  limparFalhas(email, req);
  if (precisaRehash(u.passwordHash))
    usuarios.trocarHash(u.id, await hashSenha(senha));
  evento("login_ok", { usuario: u.id, ip });
  return u;
}

// Access curto (JWT, carrega a família em sid) + refresh opaco.
const par = async (usuarioId: string, familia: string, refresh: string) => ({
  access_token: await emitirAccess(usuarioId, { sid: familia }),
  token_type: "Bearer", expires_in: ACCESS_S, refresh_token: refresh,
});

export function registrar(app: Express) {
  // Navegador: sessão em cookie (capítulo 5).
  app.post("/api/auth/login", publica(), porIp, async (req, res) => {
    const u = await conferir(req);
    if (mfaAtivo(u.id))            // senha certa ainda não é login
      return res.json({ mfa_requerido: true, desafio: abrirDesafio(u.id, "cookie") });
    iniciar(req, res, u.id);
    res.json({ usuario: publico(u) });
  });

  // Clientes de API (app, integrações): token Bearer (capítulo 6).
  app.post("/api/auth/token", publica(), porIp, async (req, res) => {
    const u = await conferir(req);
    if (mfaAtivo(u.id))
      return res.json({ mfa_requerido: true, desafio: abrirDesafio(u.id, "token") });
    const { familia, refresh } = abrirFamilia(u.id);
    res.json(await par(u.id, familia, refresh));
  });

  // Segundo passo do login de quem tem MFA (capítulo 8).
  app.post("/api/auth/mfa/verificar", publica(), porIp, async (req, res) => {
    const { desafio, codigo } = z.object({
      desafio: z.string().max(100), codigo: z.string().max(20),
    }).parse(req.body);
    const r = resolverDesafio(desafio, codigo.trim());
    if (!r) {
      evento("mfa_falhou", { ip: req.ip });
      throw new UnauthorizedError("Código inválido.");
    }
    if (r.canal === "cookie") {
      iniciar(req, res, r.usuarioId);
      return res.json({ usuario: publico(usuarios.porId(r.usuarioId)!) });
    }
    const { familia, refresh } = abrirFamilia(r.usuarioId);
    res.json(await par(r.usuarioId, familia, refresh));
  });

  // Cadastro do segundo fator, por quem já está logado.
  app.post("/api/auth/mfa/cadastro", autenticada(), (req, res) => {
    const c = iniciarCadastro(req.usuario!.id, req.usuario!.email);
    if (!c) throw new BadRequestError("O segundo fator já está ativo.");
    res.json(c);
  });

  app.post("/api/auth/mfa/ativar", autenticada(), (req, res) => {
    const { codigo } = z.object({ codigo: z.string().max(10) }).parse(req.body);
    const codigos = ativar(req.usuario!.id, codigo.trim());
    if (!codigos) throw new BadRequestError("Código inválido.");
    res.json({ codigos_recuperacao: codigos });
  });

  // Troca o refresh por um par novo (capítulo 7).
  app.post("/api/auth/refresh", publica(), porIp, async (req, res) => {
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
    evento("saiu_de_todos", { usuario: req.usuario!.id, ip: req.ip });
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

  app.post("/api/auth/reset/solicitar", publica(), porIp, (req, res) => {
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

  app.post("/api/auth/reset/confirmar", publica(), porIp, async (req, res) => {
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
    evento("senha_redefinida", { usuario: u.id, ip: req.ip });
    res.status(204).end();
  });
}
