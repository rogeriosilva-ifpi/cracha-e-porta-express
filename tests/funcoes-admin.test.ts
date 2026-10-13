import request from "supertest";
import { describe, expect, it } from "vitest";
import { criarApp } from "../src/app.js";
import { usuarios } from "../src/acesso/usuarios.js";
import { entrar } from "./ajuda.js";

const app = criarApp();

describe("funções administrativas (BFLA)", () => {
  it("recepção e profissional não desligam ninguém", async () => {
    for (const email of ["carla@hospital.dev", "ana@hospital.dev"])
      await request(app).post("/api/admin/users/u3/desligar").set(await entrar(app, email)).expect(403);
  });
  it("profissional não troca o próprio papel", async () => {
    await request(app).patch("/api/admin/users/u2/papel")
      .set(await entrar(app, "ana@hospital.dev")).send({ papel: "admin" }).expect(403);
    expect(usuarios.porId("u2")!.papel).toBe("profissional");
  });
  it("troca de papel derruba as sessões da pessoa", async () => {
    const carla = await entrar(app, "carla@hospital.dev");
    await request(app).get("/api/auth/me").set(carla).expect(200);
    await request(app).patch("/api/admin/users/u4/papel")
      .set(await entrar(app, "admin@hospital.dev")).send({ papel: "profissional" }).expect(200);
    await request(app).get("/api/auth/me").set(carla).expect(401);
  });
});
