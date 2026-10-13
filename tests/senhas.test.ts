import request from "supertest";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { criarApp } from "../src/app.js";
import { usuarios } from "../src/acesso/usuarios.js";
import { caixaDeSaida } from "../src/auth/rotas.js";
import { banco } from "../src/compartilhado/banco.js";
import { entrar } from "./ajuda.js";

const app = criarApp();
const novo = async (email: string, senha: string, status: number) =>
  request(app).post("/api/admin/users").set(await entrar(app, "admin@hospital.dev"))
    .send({ nome: "Teste", email, papel: "recepcao", senha }).expect(status);
const login = (email: string, senha: string) =>
  request(app).post("/api/auth/login").send({ email, senha });

describe("política de senha (NIST SP 800-63B-4)", () => {
  it("recusa menos de 15 caracteres", async () => {
    await novo("a@h.dev", "curta-demais", 400);
  });
  it("recusa senha da lista de bloqueio", async () => {
    await novo("b@h.dev", "123456789012345", 400);
  });
  it("recusa senha com o próprio e-mail", async () => {
    await novo("joana@h.dev", "joana-e-o-mar-azul", 400);
  });
  it("aceita frase longa sem regra de composição", async () => {
    await novo("c@h.dev", "tres palavras quaisquer juntas", 201);
  });
});

describe("login", () => {
  it("e-mail inexistente e senha errada: resposta idêntica", async () => {
    const a = await login("ninguem@hospital.dev", "x".repeat(20)).expect(401);
    const b = await login("ana@hospital.dev", "x".repeat(20)).expect(401);
    expect(a.body).toEqual(b.body);
    expect(a.body).toEqual({ error: "Credenciais inválidas." });
  });
  it("sucesso não devolve o hash", async () => {
    const r = await login("ana@hospital.dev", "cajueiro-em-flor-no-quintal").expect(200);
    expect(JSON.stringify(r.body)).not.toContain("passwordHash");
  });
  it("rehash transparente de parâmetros antigos", async () => {
    expect(usuarios.porId("u3")!.passwordHash).toContain("m=4096");
    await login("bruno@hospital.dev", "barco-azul-no-delta").expect(200);
    expect(usuarios.porId("u3")!.passwordHash).toContain("m=19456");
  });
});

describe("redefinição de senha", () => {
  it("mesma resposta para e-mail que existe e que não existe", async () => {
    const a = await request(app).post("/api/auth/reset/solicitar")
      .send({ email: "ninguem@hospital.dev" }).expect(202);
    const b = await request(app).post("/api/auth/reset/solicitar")
      .send({ email: "carla@hospital.dev" }).expect(202);
    expect(a.body).toEqual(b.body);
  });
  it("token funciona uma vez só", async () => {
    const { token } = caixaDeSaida.at(-1)!;
    const nova = "nova frase longa e bem segura";
    await request(app).post("/api/auth/reset/confirmar")
      .send({ token, novaSenha: nova }).expect(204);
    await request(app).post("/api/auth/reset/confirmar")
      .send({ token, novaSenha: nova }).expect(400);
    await login("carla@hospital.dev", nova).expect(200);
  });
  it("token expirado é recusado", async () => {
    const token = "token-de-teste-expirado";
    banco.prepare("INSERT INTO redefinicoes VALUES (?, 'u2', ?, 0)")
      .run(createHash("sha256").update(token).digest("hex"), Date.now() - 1);
    await request(app).post("/api/auth/reset/confirmar")
      .send({ token, novaSenha: "outra frase longa qualquer" }).expect(400);
  });
});
