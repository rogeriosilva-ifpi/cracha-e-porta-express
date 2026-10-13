import request from "supertest";
import { describe, expect, it } from "vitest";
import { criarApp } from "../src/app.js";
import { banco } from "../src/compartilhado/banco.js";
import { SENHAS_DE_LABORATORIO } from "../src/acesso/usuarios.js";
import { entrar } from "./ajuda.js";

const app = criarApp();
const ANA = "ana@hospital.dev";
type Par = { access_token: string; refresh_token: string };
const login = async (email = ANA): Promise<Par> =>
  (await request(app).post("/api/auth/token")
    .send({ email, senha: SENHAS_DE_LABORATORIO[email] }).expect(200)).body;
const renovar = (rt: string) =>
  request(app).post("/api/auth/refresh").send({ refresh_token: rt });
const me = (at: string) =>
  request(app).get("/api/auth/me").set("Authorization", `Bearer ${at}`);

describe("rotação", () => {
  it("cada refresh vale uma vez e devolve um par novo", async () => {
    const p1 = await login();
    const p2 = (await renovar(p1.refresh_token).expect(200)).body as Par;
    expect(p2.refresh_token).not.toBe(p1.refresh_token);
    await me(p2.access_token).expect(200);
  });
  it("reuso derruba a família inteira", async () => {
    const p1 = await login();
    const p2 = (await renovar(p1.refresh_token).expect(200)).body as Par;
    await renovar(p1.refresh_token).expect(401);   // o ladrão tenta
    await renovar(p2.refresh_token).expect(401);   // o dono também cai
    await me(p2.access_token).expect(401);         // e o access da família
  });
  it("dois pedidos ao mesmo tempo: só um vence", async () => {
    const p1 = await login();
    const rs = await Promise.all([renovar(p1.refresh_token), renovar(p1.refresh_token)]);
    expect(rs.map((r) => r.status).sort()).toEqual([200, 401]);
  });
  it("o banco guarda só o hash", async () => {
    const { refresh_token } = await login();
    const linhas = banco.prepare("SELECT token_hash FROM refresh_tokens").all();
    expect(JSON.stringify(linhas)).not.toContain(refresh_token);
  });
  it("refresh parado há mais de 7 dias morre", async () => {
    const { refresh_token } = await login();
    banco.prepare("UPDATE refresh_tokens SET expira_em = 0").run();
    await renovar(refresh_token).expect(401);
  });
});

describe("encerrar", () => {
  it("refresh não serve como access", async () => {
    await me((await login()).refresh_token).expect(401);
  });
  it("logout do app derruba só aquela família", async () => {
    const celular = await login();
    const tablet = await login();
    await request(app).post("/api/auth/logout")
      .set("Authorization", `Bearer ${celular.access_token}`).expect(204);
    await me(celular.access_token).expect(401);
    await renovar(celular.refresh_token).expect(401);
    await me(tablet.access_token).expect(200);
  });
  it("sair de todos derruba apps e navegador", async () => {
    const app1 = await login("bruno@hospital.dev");
    const cookie = await entrar(app, "bruno@hospital.dev");
    await request(app).post("/api/auth/logout-all")
      .set("Authorization", `Bearer ${app1.access_token}`).expect(204);
    await me(app1.access_token).expect(401);
    await renovar(app1.refresh_token).expect(401);
    await request(app).get("/api/auth/me").set(cookie).expect(401);
  });
});
