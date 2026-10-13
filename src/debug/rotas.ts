import type { Express } from "express";
import { db } from "../compartilhado/dados.js";

// "Só pra testar rapidinho" — escrita num sábado e nunca removida.
export function registrar(app: Express) {
  app.get("/api/debug/dump", (_req, res) => {
    res.json(db);
  });
}
