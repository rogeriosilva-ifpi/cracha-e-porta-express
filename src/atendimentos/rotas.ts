import type { Express } from "express";
import { z } from "zod";
import { exige } from "../acesso/politica.js";
import { ForbiddenError } from "../compartilhado/erros.js";
import { buscarVisivel, saida, visiveis } from "./escopo.js";

// Só estes campos; qualquer outro no corpo é 400 (atribuição em massa).
const Alteracao = z.object({
  motivo: z.string().min(3).optional(),
  status: z.enum(["aberto", "finalizado"]).optional(),
}).strict();

export function registrar(app: Express) {
  app.get("/api/encounters", exige("encounter:read"), (req, res) => {
    const u = req.usuario!;
    res.json(visiveis(u).map((a) => saida(u, a)));
  });

  app.get("/api/encounters/:id", exige("encounter:read"), (req, res) => {
    const u = req.usuario!;
    res.json(saida(u, buscarVisivel(u, String(req.params.id))));
  });

  app.patch("/api/encounters/:id", exige("encounter:update"), (req, res) => {
    const u = req.usuario!;
    const a = buscarVisivel(u, String(req.params.id));   // 404 se não vê
    if (a.profissionalId !== u.id)                       // vê, mas não é seu
      throw new ForbiddenError("Só o autor altera o atendimento.");
    Object.assign(a, Alteracao.parse(req.body));
    res.json(a);
  });
}
