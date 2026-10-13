import request from "supertest";
import { decodeJwt, decodeProtectedHeader } from "jose";
import { describe, expect, it } from "vitest";
import { criarApp } from "../src/app.js";
import { AUDIENCIA, emissor, novaChave } from "../src/acesso/tokens.js";
import { SENHAS_DE_LABORATORIO } from "../src/acesso/usuarios.js";
import { entrar } from "./ajuda.js";

const app = criarApp();
const ANA = "ana@hospital.dev";
const token = async (email = ANA) => (await request(app).post("/api/auth/token")
  .send({ email, senha: SENHAS_DE_LABORATORIO[email] }).expect(200)).body;
const me = (t: string) =>
  request(app).get("/api/auth/me").set("Authorization", `Bearer ${t}`);

describe("o que o token carrega", () => {
  it("EdDSA, kid e typ at+jwt no cabeçalho", async () => {
    const { access_token } = await token();
    expect(decodeProtectedHeader(access_token)).toMatchObject(
      { alg: "EdDSA", typ: "at+jwt" });
  });
  it("só identificadores, nenhum dado pessoal, 10 minutos", async () => {
    const { access_token, expires_in } = await token();
    const p = decodeJwt(access_token);
    expect(Object.keys(p).sort())
      .toEqual(["aud", "exp", "iat", "iss", "jti", "sub"]);
    expect(p.exp! - p.iat!).toBe(600);
    expect(expires_in).toBe(600);
  });
  it("JWKS publica só a parte pública da chave", async () => {
    const r = await request(app).get("/.well-known/jwks.json").expect(200);
    const { kid } = decodeProtectedHeader((await token()).access_token);
    expect(r.body.keys.map((k: { kid: string }) => k.kid)).toContain(kid);
    expect(JSON.stringify(r.body)).not.toContain('"d"');
  });
});

describe("o que a API recusa", () => {
  it("aceita o token certo", async () => {
    await me((await token()).access_token).expect(200);
  });
  it("token de outra audiência (outro serviço)", async () => {
    const paraLaudos = emissor("servico-de-laudos", 600);
    await me(await paraLaudos("u2")).expect(401);
  });
  it("token vencido, mesmo assinado por nós", async () => {
    const vencido = emissor(AUDIENCIA, -120);   // além da tolerância de 30 s
    await me(await vencido("u2")).expect(401);
  });
  it("token malformado é 401, nunca 500", async () => {
    await me("isto.nao.e-um-token").expect(401);
    await request(app).get("/api/auth/me")
      .set("Authorization", "Basic YW5hOnNlbmhh").expect(401);
  });
  it("Bearer inválido não cai para o cookie", async () => {
    const cookie = await entrar(app, ANA);
    await request(app).get("/api/auth/me").set(cookie)
      .set("Authorization", "Bearer lixo").expect(401);
  });
});

describe("rotação de chave", () => {
  it("token da chave anterior vale até vencer; o da retirada, não", async () => {
    const t1 = (await token()).access_token;
    await novaChave();                 // t1 foi assinado pela anterior
    await me(t1).expect(200);
    await novaChave();                 // a chave de t1 saiu do chaveiro
    await me(t1).expect(401);
    await me((await token()).access_token).expect(200);
  });
});
