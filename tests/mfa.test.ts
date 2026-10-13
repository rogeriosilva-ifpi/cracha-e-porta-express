import request from "supertest";
import * as OTPAuth from "otpauth";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { criarApp } from "../src/app.js";
import { SENHAS_DE_LABORATORIO, TOTP_DE_LABORATORIO } from "../src/acesso/usuarios.js";

const app = criarApp();
const EVA = "eva@hospital.dev";
// O "aplicativo autenticador" da Eva, como o celular dela faria.
const app2fa = (segredo: string) => new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(segredo) });
let agora = Date.parse("2026-10-13T12:00:00Z");
const proximoPasso = () => { agora += 30_000; vi.setSystemTime(agora); };
beforeAll(() => { vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(agora); });
afterAll(() => { vi.useRealTimers(); });

const senha = (email: string, rota = "/api/auth/login") => request(app).post(rota)
  .send({ email, senha: SENHAS_DE_LABORATORIO[email] }).expect(200);
const verificar = (desafio: string, codigo: string) =>
  request(app).post("/api/auth/mfa/verificar").send({ desafio, codigo });

describe("login com segundo fator", () => {
  it("senha certa não abre sessão: devolve um desafio", async () => {
    const r = await senha(EVA);
    expect(r.body.mfa_requerido).toBe(true);
    expect(r.headers["set-cookie"]).toBeUndefined();
  });
  it("desafio + código do autenticador abre a sessão", async () => {
    proximoPasso();
    const { desafio } = (await senha(EVA)).body;
    const r = await verificar(desafio, app2fa(TOTP_DE_LABORATORIO).generate()).expect(200);
    expect(String(r.headers["set-cookie"])).toContain("__Host-sessao");
  });
  it("o mesmo código não vale duas vezes", async () => {
    proximoPasso();
    const codigo = app2fa(TOTP_DE_LABORATORIO).generate();
    await verificar((await senha(EVA)).body.desafio, codigo).expect(200);
    await verificar((await senha(EVA)).body.desafio, codigo).expect(401);
  });
  it("cinco erros matam o desafio, mesmo que o sexto esteja certo", async () => {
    proximoPasso();
    const { desafio } = (await senha(EVA)).body;
    for (let i = 0; i < 5; i++) await verificar(desafio, "000000").expect(401);
    await verificar(desafio, app2fa(TOTP_DE_LABORATORIO).generate()).expect(401);
  });
  it("cliente de API também passa pelo desafio", async () => {
    proximoPasso();
    const r1 = await senha(EVA, "/api/auth/token");
    expect(r1.body.access_token).toBeUndefined();
    const r2 = await verificar(r1.body.desafio, app2fa(TOTP_DE_LABORATORIO).generate()).expect(200);
    expect(r2.body.access_token).toBeTruthy();
  });
});

describe("cadastro e recuperação", () => {
  it("ativa com um código, entrega 10 códigos de uso único", async () => {
    const BRUNO = "bruno@hospital.dev";
    const cookie = { Cookie: String((await senha(BRUNO)).headers["set-cookie"]).split(";")[0]! };
    const { segredo, uri } = (await request(app).post("/api/auth/mfa/cadastro").set(cookie).expect(200)).body;
    expect(uri).toMatch(/^otpauth:\/\/totp\//);
    await request(app).post("/api/auth/mfa/ativar").set(cookie).send({ codigo: "123456" }).expect(400);
    proximoPasso();
    const { codigos_recuperacao: codigos } = (await request(app).post("/api/auth/mfa/ativar")
      .set(cookie).send({ codigo: app2fa(segredo).generate() }).expect(200)).body;
    expect(codigos).toHaveLength(10);
    await request(app).post("/api/auth/mfa/cadastro").set(cookie).expect(400);
    // celular perdido: o código de recuperação entra no lugar do TOTP, uma vez
    await verificar((await senha(BRUNO)).body.desafio, codigos[0]).expect(200);
    await verificar((await senha(BRUNO)).body.desafio, codigos[0]).expect(401);
  });
  it("desafio inventado é recusado", async () => {
    await verificar("inventado", "000000").expect(401);
  });
});
