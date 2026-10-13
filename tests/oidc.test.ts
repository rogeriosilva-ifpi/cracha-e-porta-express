import request from "supertest";
import { createHash } from "node:crypto";
import {
  SignJWT, createLocalJWKSet, exportJWK, generateKeyPair,
} from "jose";
import { beforeAll, describe, expect, it } from "vitest";
import { criarApp } from "../src/app.js";
import { provedor, usarProvedor } from "../src/auth/oidc.js";

// Provedor OIDC FALSO, dentro da suíte: assina ID tokens com uma chave
// de teste e registra o que recebeu. Nada sai deste processo.
const app = criarApp();
const EMISSOR = provedor.emissor;
let recebido: { code: string; verificador: string };
let proximo: { nonce?: string; sub?: string; aud?: string } = {};

beforeAll(async () => {
  const { privateKey, publicKey } = await generateKeyPair("RS256");
  const jwk = { ...(await exportJWK(publicKey)), kid: "kc1", alg: "RS256" };
  usarProvedor({
    emissor: EMISSOR, clientId: "mini-prontuario",
    redirectUri: "http://localhost:3000/api/auth/oidc/callback",
    autorizar: "https://provedor.exemplo/auth",
    async trocarCodigo(code, verificador) {
      recebido = { code, verificador };
      const id_token = await new SignJWT({ nonce: proximo.nonce })
        .setProtectedHeader({ alg: "RS256", kid: "kc1" })
        .setIssuer(EMISSOR).setAudience(proximo.aud ?? "mini-prontuario")
        .setSubject(proximo.sub ?? "ana-no-provedor")
        .setIssuedAt().setExpirationTime("5m").sign(privateKey);
      return { id_token };
    },
    chaves: createLocalJWKSet({ keys: [jwk] }),
  });
});

async function iniciar() {
  const r = await request(app).get("/api/auth/oidc/iniciar").expect(302);
  const url = new URL(r.headers.location!);
  const cookie = String(r.headers["set-cookie"]).split(";")[0]!;
  const p = Object.fromEntries(url.searchParams);
  proximo = { nonce: p.nonce };                 // o provedor ecoa o nonce
  return { p, cookie };
}
const voltar = (query: string, cookie?: string) => {
  const r = request(app).get(`/api/auth/oidc/callback?${query}`);
  return cookie ? r.set("Cookie", cookie) : r;
};

describe("ida ao provedor", () => {
  it("leva state, nonce e PKCE S256; guarda o state num cookie __Host-", async () => {
    const r = await request(app).get("/api/auth/oidc/iniciar").expect(302);
    const p = new URL(r.headers.location!).searchParams;
    for (const k of ["state", "nonce", "code_challenge"]) expect(p.get(k)).toBeTruthy();
    expect(p.get("code_challenge_method")).toBe("S256");
    expect(String(r.headers["set-cookie"])).toMatch(/^__Host-oidc=.*HttpOnly/);
  });
});

describe("volta do provedor", () => {
  it("fluxo completo: sessão da Ana, e o verificador PKCE confere", async () => {
    const { p, cookie } = await iniciar();
    const r = await voltar(`code=abc&state=${p.state}`, cookie).expect(200);
    expect(r.body.usuario.email).toBe("ana@hospital.dev");
    expect(String(r.headers["set-cookie"])).toContain("__Host-sessao");
    const desafio = createHash("sha256").update(recebido.verificador).digest("base64url");
    expect(desafio).toBe(p.code_challenge);
  });
  it("sem state, ou state diferente do cookie: 400", async () => {
    const { p, cookie } = await iniciar();
    await voltar("code=abc", cookie).expect(400);
    await voltar(`code=abc&state=${p.state}`).expect(400);
    await voltar(`code=abc&state=outro`, cookie).expect(400);
  });
  it("o mesmo state não serve duas vezes", async () => {
    const { p, cookie } = await iniciar();
    await voltar(`code=abc&state=${p.state}`, cookie).expect(200);
    await voltar(`code=abc&state=${p.state}`, cookie).expect(400);
  });
  it("ID token com nonce de outro pedido: 401", async () => {
    const { p, cookie } = await iniciar();
    proximo.nonce = "nonce-de-outro-pedido";
    await voltar(`code=abc&state=${p.state}`, cookie).expect(401);
  });
  it("ID token emitido para outro cliente: 401", async () => {
    const { p, cookie } = await iniciar();
    proximo.aud = "outro-sistema";
    await voltar(`code=abc&state=${p.state}`, cookie).expect(401);
  });
  it("identidade externa sem vínculo: 403, nunca conta achada pelo e-mail", async () => {
    const { p, cookie } = await iniciar();
    proximo.sub = "desconhecido";
    await voltar(`code=abc&state=${p.state}`, cookie).expect(403);
  });
});
