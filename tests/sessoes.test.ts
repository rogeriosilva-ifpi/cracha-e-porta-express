import request from "supertest";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { criarApp } from "../src/app.js";
import { COOKIE, OCIOSA_MS } from "../src/acesso/sessoes.js";
import { caixaDeSaida } from "../src/auth/rotas.js";
import { banco } from "../src/compartilhado/banco.js";
import { entrar } from "./ajuda.js";

const app = criarApp();
const me = (cookie: Record<string, string>) =>
  request(app).get("/api/auth/me").set(cookie);
const tokenDe = (c: Record<string, string>) => c.Cookie!.split("=")[1]!;

describe("cookie de sessão", () => {
  it("HttpOnly, Secure, SameSite=Lax, prefixo __Host-", async () => {
    const r = await request(app).post("/api/auth/login")
      .send({ email: "ana@hospital.dev", senha: "cajueiro-em-flor-no-quintal" });
    const c = (r.headers["set-cookie"] as unknown as string[])[0]!;
    expect(c).toMatch(new RegExp(`^${COOKIE}=`));
    for (const f of ["HttpOnly", "Secure", "SameSite=Lax", "Path=/"])
      expect(c).toContain(f);
  });
  it("login nunca reaproveita o identificador enviado (fixação)", async () => {
    const r = await request(app).post("/api/auth/login")
      .set("Cookie", `${COOKIE}=fixado-pelo-atacante`)
      .send({ email: "ana@hospital.dev", senha: "cajueiro-em-flor-no-quintal" });
    expect(String(r.headers["set-cookie"])).not.toContain("fixado-pelo-atacante");
  });
});

describe("ciclo de vida", () => {
  it("logout apaga a sessão no servidor", async () => {
    const c = await entrar(app, "ana@hospital.dev");
    await me(c).expect(200);
    await request(app).post("/api/auth/logout").set(c).expect(204);
    await me(c).expect(401);
  });
  it("expira após 30 min sem uso", async () => {
    const c = await entrar(app, "ana@hospital.dev");
    const h = createHash("sha256").update(tokenDe(c)).digest("hex");
    banco.prepare("UPDATE sessoes SET ultimo_uso = ? WHERE id_hash = ?")
      .run(Date.now() - OCIOSA_MS - 1000, h);
    await me(c).expect(401);
  });
  it("expira no limite absoluto, mesmo em uso", async () => {
    const c = await entrar(app, "ana@hospital.dev");
    const h = createHash("sha256").update(tokenDe(c)).digest("hex");
    banco.prepare("UPDATE sessoes SET expira_em = ? WHERE id_hash = ?")
      .run(Date.now() - 1, h);
    await me(c).expect(401);
  });
  it("redefinir a senha derruba as sessões antigas", async () => {
    const c = await entrar(app, "carla@hospital.dev");
    await request(app).post("/api/auth/reset/solicitar")
      .send({ email: "carla@hospital.dev" }).expect(202);
    await request(app).post("/api/auth/reset/confirmar")
      .send({ token: caixaDeSaida.at(-1)!.token, novaSenha: "uma frase nova e longa" })
      .expect(204);
    await me(c).expect(401);
  });
});

describe("CSRF", () => {
  it("POST vindo de outro site é recusado", async () => {
    const c = await entrar(app, "ana@hospital.dev");
    await request(app).post("/api/patients").set(c)
      .set("Origin", "https://atacante.exemplo")
      .send({ nome: "X", cns: "898000000000001", nascimento: "2000-01-01" })
      .expect(403);
  });
  it("POST da própria aplicação passa", async () => {
    const c = await entrar(app, "ana@hospital.dev");
    await request(app).post("/api/patients").set(c)
      .set("Origin", "http://localhost:5173")
      .send({ nome: "Maria", cns: "898000000000002", nascimento: "2000-01-01" })
      .expect(201);
  });
});
