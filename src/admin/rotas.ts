import type { Express } from "express";
import { z } from "zod";
import { exige } from "../acesso/politica.js";
import { hashSenha, motivoDeRecusa } from "../acesso/senhas.js";
import { BadRequestError } from "../compartilhado/erros.js";
import { usuarios } from "../acesso/usuarios.js";
import { novoId } from "../compartilhado/dados.js";

const NovoUsuario = z.object({
  nome: z.string().min(2),
  email: z.email(),
  papel: z.enum(["admin", "profissional", "recepcao"]),
  senha: z.string(),
});

export function registrar(app: Express) {
  app.get("/api/admin/users", exige("user:admin"), (_req, res) => {
    res.json(usuarios.listar());
  });

  app.post("/api/admin/users", exige("user:admin"), async (req, res) => {
    const { senha, ...dados } = NovoUsuario.parse(req.body);
    const motivo = motivoDeRecusa(senha, dados.email);
    if (motivo) throw new BadRequestError(motivo);
    const u = usuarios.criar({
      id: novoId("u"), ...dados, passwordHash: await hashSenha(senha),
    });
    res.status(201).json(u);
  });
}
