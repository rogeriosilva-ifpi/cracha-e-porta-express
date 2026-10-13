import express from "express";
import * as pacientes from "./pacientes/rotas.js";
import * as atendimentos from "./atendimentos/rotas.js";
import * as prescricoes from "./prescricoes/rotas.js";
import * as admin from "./admin/rotas.js";
import * as debug from "./debug/rotas.js";

export function criarApp() {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => { res.json({ status: "ok" }); });
  pacientes.registrar(app);
  atendimentos.registrar(app);
  prescricoes.registrar(app);
  admin.registrar(app);
  debug.registrar(app);

  return app;
}
