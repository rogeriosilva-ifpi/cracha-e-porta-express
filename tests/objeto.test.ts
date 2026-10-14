import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { criarApp } from "../src/app.js";
import { db } from "../src/compartilhado/dados.js";
import { usuarios } from "../src/acesso/usuarios.js";
import { entrar } from "./ajuda.js";

const app = criarApp();
const como = async (email: string) => entrar(app, email);
const plantao = (h: number) => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 13, h, 0));
};
afterEach(() => { vi.useRealTimers(); });

describe("BOLA: o objeto dos outros", () => {
  it("Bruno não lê nem altera o atendimento da Ana: 404, não 403", async () => {
    const bruno = await como("bruno@hospital.dev");
    await request(app).get("/api/encounters/e1").set(bruno).expect(404);
    await request(app).patch("/api/encounters/e1").set(bruno).send({ motivo: "x" + "y".repeat(5) }).expect(404);
    await request(app).get("/api/encounters/nao-existe").set(bruno).expect(404);   // igual
  });
  it("a lista já vem escopada: Bruno só recebe os dele", async () => {
    const r = await request(app).get("/api/encounters").set(await como("bruno@hospital.dev")).expect(200);
    expect(r.body.map((a: { id: string }) => a.id)).toEqual(["e2"]);
  });
  it("prescrições também: Bruno não vê as do atendimento da Ana", async () => {
    const r = await request(app).get("/api/medication-requests?encounterId=e1")
      .set(await como("bruno@hospital.dev")).expect(200);
    expect(r.body).toEqual([]);
  });
  it("admin vê o atendimento da Ana, mas não o altera: 403", async () => {
    await request(app).patch("/api/encounters/e1").set(await como("admin@hospital.dev"))
      .send({ status: "finalizado" }).expect(403);
  });
});

describe("a regra da prescrição no domínio", () => {
  it("Ana prescreve no próprio atendimento, de plantão; quem prescreve vem da sessão", async () => {
    plantao(10);
    const r = await request(app).post("/api/encounters/e1/medication-requests")
      .set(await como("ana@hospital.dev")).send({ medicamento: "AAS 100 mg", posologia: "1x ao dia" })
      .expect(201);
    expect(r.body.profissionalId).toBe("u2");
  });
  it("fora do plantão: 403", async () => {
    plantao(22);
    await request(app).post("/api/encounters/e1/medication-requests")
      .set(await como("ana@hospital.dev")).send({ medicamento: "AAS 100 mg", posologia: "1x ao dia" })
      .expect(403);
  });
  it("profissionalId no corpo: 400", async () => {
    plantao(10);
    await request(app).post("/api/encounters/e1/medication-requests")
      .set(await como("ana@hospital.dev"))
      .send({ medicamento: "AAS", posologia: "1x", profissionalId: "u3" }).expect(400);
  });
});

describe("BOPLA: campos a mais e campos a menos", () => {
  it("recepção vê o atendimento sem o motivo clínico", async () => {
    const r = await request(app).get("/api/encounters/e1").set(await como("carla@hospital.dev")).expect(200);
    expect(r.body).toEqual({ id: "e1", pacienteId: "p1", profissionalId: "u2", status: "aberto" });
  });
  it("ninguém se promove pelo próprio perfil", async () => {
    await request(app).patch("/api/auth/me").set(await como("carla@hospital.dev"))
      .send({ nome: "Carla", papel: "admin" }).expect(400);
    expect(usuarios.porId("u4")!.papel).toBe("recepcao");
  });
  it("alteração com campo fora da lista: 400, e nada muda", async () => {
    await request(app).patch("/api/encounters/e1").set(await como("ana@hospital.dev"))
      .send({ motivo: "Dor torácica", pacienteId: "p2" }).expect(400);
    expect(db.atendimentos[0]!.pacienteId).toBe("p1");
  });
  it("lista de usuários sem hash de senha", async () => {
    const r = await request(app).get("/api/admin/users").set(await como("admin@hospital.dev")).expect(200);
    expect(JSON.stringify(r.body)).not.toContain("passwordHash");
  });
});
