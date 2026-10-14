import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { criarApp } from "../src/app.js";
import { entrar } from "./ajuda.js";

const app = criarApp();

describe("pipeline do capítulo 3", () => {
  it("rota pública responde sem crachá", async () => {
    await request(app).get("/health").expect(200);
  });
  it("portão 1: sem crachá é 401", async () => {
    const r = await request(app).get("/api/patients").expect(401);
    expect(r.body).toEqual({ error: "Não autenticado." });
  });
  it("portão 2: recepção não lê prescrições (403)", async () => {
    await request(app).get("/api/medication-requests").set(await entrar(app, "carla@hospital.dev")).expect(403);
  });
  it("portão 2: nem admin prescreve (403)", async () => {
    await request(app).post("/api/encounters/e1/medication-requests")
      .set(await entrar(app, "admin@hospital.dev"))
      .send({ medicamento: "AAS", posologia: "1x", profissionalId: "u1" }).expect(403);
  });
  it("profissional prescreve no próprio atendimento, de plantão (201)", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 13, 10, 0));    // plantão diurno da Ana
    try {
      await request(app).post("/api/encounters/e1/medication-requests")
        .set(await entrar(app, "ana@hospital.dev"))
        .send({ medicamento: "AAS 100 mg", posologia: "1x ao dia" }).expect(201);
    } finally { vi.useRealTimers(); }
  });
  it("JSON malformado: 400 sem pilha", async () => {
    const r = await request(app).post("/api/patients").set(await entrar(app, "ana@hospital.dev"))
      .set("Content-Type", "application/json").send('{"nome": "Teste",').expect(400);
    expect(JSON.stringify(r.body)).not.toContain("node_modules");
  });
  it("rota inexistente: 404 em JSON", async () => {
    const r = await request(app).get("/api/debug/dump").expect(404);
    expect(r.body).toEqual({ error: "Rota não encontrada." });
  });
  it("não anuncia o framework", async () => {
    const r = await request(app).get("/health");
    expect(r.headers["x-powered-by"]).toBeUndefined();
  });
});
