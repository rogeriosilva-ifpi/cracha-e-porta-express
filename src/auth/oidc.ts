// Login federado com OpenID Connect: Authorization Code + PKCE,
// state e nonce (capítulo 8). O provedor padrão é um Keycloak local.
import type { Express } from "express";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { parseCookie } from "cookie";
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";
import { z } from "zod";
import { publica } from "../acesso/politica.js";
import { iniciar } from "../acesso/sessoes.js";
import { publico, usuarios } from "../acesso/usuarios.js";
import { banco } from "../compartilhado/banco.js";
import {
  BadRequestError, ForbiddenError, UnauthorizedError,
} from "../compartilhado/erros.js";

const sha256 = (s: string) => createHash("sha256").update(s).digest();
const aleatorio = () => randomBytes(32).toString("base64url");
const COOKIE = "__Host-oidc";
const PEDIDO_MS = 10 * 60 * 1000;

export interface Provedor {
  emissor: string; clientId: string; redirectUri: string;
  autorizar: string;                                   // URL de autorização
  trocarCodigo(code: string, verificador: string): Promise<{ id_token: string }>;
  chaves: JWTVerifyGetKey;                             // JWKS do provedor
}

const KC = process.env.OIDC_ISSUER ?? "http://localhost:8080/realms/hospital";
export let provedor: Provedor = {
  emissor: KC,
  clientId: process.env.OIDC_CLIENT_ID ?? "mini-prontuario",
  redirectUri: process.env.OIDC_REDIRECT ?? "http://localhost:3000/api/auth/oidc/callback",
  autorizar: `${KC}/protocol/openid-connect/auth`,
  async trocarCodigo(code, verificador) {
    const r = await fetch(`${KC}/protocol/openid-connect/token`, {
      method: "POST",
      body: new URLSearchParams({ grant_type: "authorization_code", code,
        code_verifier: verificador, client_id: this.clientId,
        redirect_uri: this.redirectUri }),
    });
    if (!r.ok) throw new UnauthorizedError("Código recusado pelo provedor.");
    return r.json() as Promise<{ id_token: string }>;
  },
  chaves: createRemoteJWKSet(new URL(`${KC}/protocol/openid-connect/certs`)),
};
/** Os testes trocam o provedor por um falso, dentro da própria suíte. */
export const usarProvedor = (p: Provedor) => { provedor = p; };

const iguais = (a: string, b: string) =>
  a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export function registrar(app: Express) {
  // 1. Manda o navegador ao provedor, com state, nonce e PKCE.
  app.get("/api/auth/oidc/iniciar", publica(), (_req, res) => {
    const state = aleatorio(), nonce = aleatorio(), verificador = aleatorio();
    banco.prepare("INSERT INTO oidc_pedidos VALUES (?, ?, ?, ?, 0)")
      .run(sha256(state).toString("hex"), nonce, verificador, Date.now() + PEDIDO_MS);
    res.cookie(COOKIE, state, { httpOnly: true, secure: true, sameSite: "lax",
                                path: "/", maxAge: PEDIDO_MS });
    const url = new URL(provedor.autorizar);
    url.search = new URLSearchParams({
      response_type: "code", client_id: provedor.clientId,
      redirect_uri: provedor.redirectUri, scope: "openid",
      state, nonce,
      code_challenge: sha256(verificador).toString("base64url"),
      code_challenge_method: "S256",
    }).toString();
    res.redirect(302, url.toString());
  });

  // 2. O provedor devolve o navegador com ?code&state.
  app.get("/api/auth/oidc/callback", publica(), async (req, res) => {
    const { code, state } = z.object({
      code: z.string().max(2000), state: z.string().max(100).optional(),
    }).parse(req.query);
    const doCookie = parseCookie(req.headers.cookie ?? "")[COOKIE];
    if (!state || !doCookie || !iguais(state, doCookie))  // CSRF de login
      throw new BadRequestError("Pedido de login inválido.");
    const h = sha256(state).toString("hex");
    const p = banco.prepare("SELECT nonce, verificador FROM oidc_pedidos WHERE state_hash = ?")
      .get(h) as { nonce: string; verificador: string } | undefined;
    const { changes } = banco.prepare(`UPDATE oidc_pedidos SET usado = 1
      WHERE state_hash = ? AND usado = 0 AND expira_em > ?`).run(h, Date.now());
    if (!p || changes === 0) throw new BadRequestError("Pedido de login inválido.");
    res.clearCookie(COOKIE, { path: "/", secure: true });

    const { id_token } = await provedor.trocarCodigo(code, p.verificador);
    let sub: string;
    try {
      const { payload } = await jwtVerify(id_token, provedor.chaves, {
        issuer: provedor.emissor, audience: provedor.clientId,
        algorithms: ["RS256", "ES256", "EdDSA"],
        requiredClaims: ["sub", "exp", "iat", "nonce"], clockTolerance: 30,
      });
      if (payload.nonce !== p.nonce) throw new Error("nonce");
      sub = payload.sub!;
    } catch {
      throw new UnauthorizedError("Identidade do provedor inválida.");
    }
    // Vínculo explícito: nunca "achar" a conta pelo e-mail que o provedor manda.
    const v = banco.prepare(`SELECT usuario_id FROM identidades_externas
      WHERE emissor = ? AND sub = ?`).get(provedor.emissor, sub) as
      { usuario_id: string } | undefined;
    if (!v) throw new ForbiddenError("Conta externa não vinculada.");
    iniciar(req, res, v.usuario_id);       // sessão nova (fixação)
    res.json({ usuario: publico(usuarios.porId(v.usuario_id)!) });
  });
}
