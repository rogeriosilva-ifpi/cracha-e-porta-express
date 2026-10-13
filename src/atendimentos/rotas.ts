import type { Express } from "express";
import { z } from "zod";
import { db } from "../compartilhado/dados.js";
import { exige } from "../acesso/politica.js";
import { NotFoundError } from "../compartilhado/erros.js";

const Alteracao = z.object({
  motivo: z.string().min(3).optional(),
  status: z.enum(["aberto", "finalizado"]).optional(),
});

export function registrar(app: Express) {
  app.get("/api/encounters/:id", exige("encounter:read"), (req, res) => {
    const e = db.atendimentos.find((x) => x.id === req.params.id);
    if (!e) throw new NotFoundError();
    res.json(e);
  });

  app.patch("/api/encounters/:id", exige("encounter:update"), (req, res) => {
    const e = db.atendimentos.find((x) => x.id === req.params.id);
    if (!e) throw new NotFoundError();
    Object.assign(e, Alteracao.parse(req.body));
    res.json(e);
  });
}
