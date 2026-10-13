import type { Express } from "express";
import { z } from "zod";
import { exige } from "../acesso/politica.js";
import { db, novoId } from "../compartilhado/dados.js";

const NovoUsuario = z.object({
  nome: z.string().min(2),
  email: z.email(),
  papel: z.enum(["admin", "profissional", "recepcao"]),
});

export function registrar(app: Express) {
  app.get("/api/admin/users", exige("user:admin"), (_req, res) => {
    res.json(db.usuarios);
  });

  app.post("/api/admin/users", exige("user:admin"), (req, res) => {
    const dados = NovoUsuario.parse(req.body);
    const u = { id: novoId("u"), ...dados, passwordHash: "" };
    db.usuarios.push(u);
    res.status(201).json(u);
  });
}
