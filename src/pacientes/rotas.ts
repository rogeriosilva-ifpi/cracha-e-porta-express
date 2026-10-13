import type { Express } from "express";
import { z } from "zod";
import { db, novoId } from "../compartilhado/dados.js";
import { NotFoundError } from "../compartilhado/erros.js";

const NovoPaciente = z.object({
  nome: z.string().min(2),
  cns: z.string().regex(/^\d{15}$/),
  nascimento: z.iso.date(),
});

export function registrar(app: Express) {
  app.get("/api/patients", (_req, res) => {
    res.json(db.pacientes);
  });

  app.get("/api/patients/:id", (req, res) => {
    const p = db.pacientes.find((x) => x.id === req.params.id);
    if (!p) throw new NotFoundError();
    res.json(p);
  });

  app.post("/api/patients", (req, res) => {
    const dados = NovoPaciente.parse(req.body);
    const p = { id: novoId("p"), ...dados };
    db.pacientes.push(p);
    res.status(201).json(p);
  });
}
