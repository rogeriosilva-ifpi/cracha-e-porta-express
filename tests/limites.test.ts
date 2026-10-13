import request from "supertest";
import type { Request } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { criarApp } from "../src/app.js";
import { bloqueio, registrarFalha, zerarLimites } from "../src/acesso/limites.js";
import { SENHAS_DE_LABORATORIO, usuarios } from "../src/acesso/usuarios.js";
import { usarSaida } from "../src/compartilhado/eventos.js";
import { entrar } from "./ajuda.js";

const app = criarApp();
const ANA = "ana@hospital.dev";
const linhas: string[] = [];
usarSaida((l) => linhas.push(l));
beforeEach(() => { zerarLimites(); linhas.length = 0; });

const login = (email: string, senha: string) =>
  request(app).post("/api/auth/login").send({ email, senha });
const de = (ip: string) => ({ ip }) as Request;

describe("limite por conta", () => {
  it("5 senhas erradas seguidas: a 6ª tentativa, mesmo certa, recebe 429", async () => {
    for (let i = 0; i < 5; i++) await login(ANA, "palpite-errado-numero-" + i).expect(401);
    const r = await login(ANA, SENHAS_DE_LABORATORIO[ANA]!).expect(429);
    expect(Number(r.headers["retry-after"])).toBeGreaterThan(0);
  });
  it("senha certa zera as falhas daquele IP", async () => {
    for (let i = 0; i < 4; i++) await login(ANA, "palpite-errado-" + i).expect(401);
    await login(ANA, SENHAS_DE_LABORATORIO[ANA]!).expect(200);
    for (let i = 0; i < 4; i++) await login(ANA, "outro-palpite-" + i).expect(401);
    await login(ANA, SENHAS_DE_LABORATORIO[ANA]!).expect(200);
  });
  it("e-mail inexistente é limitado igual: o 429 não revela quem existe", async () => {
    for (let i = 0; i < 5; i++) await login("ninguem@hospital.dev", "x".repeat(15)).expect(401);
    await login("ninguem@hospital.dev", "x".repeat(15)).expect(429);
  });
  it("falhas de um IP não trancam a mesma conta vinda de outro", () => {
    for (let i = 0; i < 5; i++) registrarFalha(ANA, de("10.0.0.1"));
    expect(bloqueio(ANA, de("10.0.0.1"))).toBeGreaterThan(0);
    expect(bloqueio(ANA, de("10.0.0.2"))).toBeUndefined();
  });
  it("50 falhas espalhadas por muitos IPs trancam a conta em todo lugar", () => {
    for (let i = 0; i < 50; i++) registrarFalha(ANA, de(`10.0.1.${i}`));
    expect(bloqueio(ANA, de("10.9.9.9"))).toBeGreaterThan(0);
  });
});

describe("eventos de segurança", () => {
  it("falha de login vira evento sem senha e sem e-mail", async () => {
    await login(ANA, "senha-que-nao-pode-vazar").expect(401);
    const e = JSON.parse(linhas.find((l) => l.includes("login_falhou"))!);
    expect(e).toMatchObject({ evento: "login_falhou", usuario: "u2" });
    expect(linhas.join()).not.toContain("senha-que-nao-pode-vazar");
    expect(linhas.join()).not.toContain(ANA);
  });
});

describe("falhar fechado", () => {
  it("exceção ao identificar vira 500 genérico, nunca acesso", async () => {
    const cookie = await entrar(app, ANA);
    const espiao = vi.spyOn(usuarios, "porId").mockImplementation(() => {
      throw new Error("banco fora do ar");
    });
    const r = await request(app).get("/api/patients").set(cookie);
    espiao.mockRestore();
    expect(r.status).toBe(500);
    expect(r.body).toEqual({ error: "Erro interno." });
  });
});
