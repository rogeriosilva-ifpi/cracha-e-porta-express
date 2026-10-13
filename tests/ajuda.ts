// Login de verdade para os testes: devolve o cabeçalho Cookie da sessão.
import request from "supertest";
import type { Express } from "express";
import { SENHAS_DE_LABORATORIO } from "../src/acesso/usuarios.js";

export async function entrar(app: Express, email: string, senha?: string) {
  const r = await request(app).post("/api/auth/login")
    .send({ email, senha: senha ?? SENHAS_DE_LABORATORIO[email] }).expect(200);
  const sc = r.headers["set-cookie"] as unknown as string[];
  return { Cookie: sc.map((c) => c.split(";")[0]).join("; ") };
}
