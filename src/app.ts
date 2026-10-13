import express from "express";
import helmet from "helmet";
import cors from "cors";
import { publica } from "./acesso/politica.js";
import { rotaInexistente, tratarErros } from "./http/erros.js";
import * as pacientes from "./pacientes/rotas.js";
import * as atendimentos from "./atendimentos/rotas.js";
import * as prescricoes from "./prescricoes/rotas.js";
import * as admin from "./admin/rotas.js";
import * as debug from "./debug/rotas.js";

const ORIGENS = (process.env.CORS_ORIGINS ?? "http://localhost:5173").split(",");

export function criarApp() {
  const app = express();
  // BORDA: cabeçalhos, origem, corpo. A ordem importa.
  app.use(helmet());
  app.use(cors({ origin: ORIGENS, credentials: true }));
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", publica(), (_req, res) => { res.json({ status: "ok" }); });
  pacientes.registrar(app);
  atendimentos.registrar(app);
  prescricoes.registrar(app);
  admin.registrar(app);
  debug.registrar(app);

  // FIM DO PIPELINE: o que não casou é 404; todo erro passa por aqui.
  app.use(rotaInexistente);
  app.use(tratarErros);
  return app;
}
