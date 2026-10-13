import type { Express } from "express";
import { z } from "zod";
import { autenticada, exige } from "../acesso/politica.js";
import { revogarTodas } from "../acesso/refresh.js";
import { encerrarTodas } from "../acesso/sessoes.js";
import { hashSenha, motivoDeRecusa } from "../acesso/senhas.js";
import { BadRequestError, ForbiddenError, NotFoundError } from "../compartilhado/erros.js";
import { publico, usuarios } from "../acesso/usuarios.js";
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

  // Desligamento: derruba sessões e apps. VERSÃO INGÊNUA (cap11-antes):
  // "o botão só aparece para o admin na tela".
  app.post("/api/admin/users/:id/desligar", autenticada(), (req, res) => {
    const u = usuarios.porId(String(req.params.id));
    if (!u) throw new NotFoundError();
    encerrarTodas(u.id);
    revogarTodas(u.id);
    res.status(204).end();
  });

  // Troca de papel. VERSÃO INGÊNUA: papel conferido à mão.
  app.patch("/api/admin/users/:id/papel", autenticada(), (req, res) => {
    if (req.usuario!.papel !== "admin") throw new ForbiddenError();
    const { papel } = z.object({ papel: z.enum(["admin", "profissional", "recepcao"]) })
      .parse(req.body);
    const u = usuarios.porId(String(req.params.id));
    if (!u) throw new NotFoundError();
    usuarios.trocarPapel(u.id, papel);
    res.json(publico(usuarios.porId(u.id)!));
  });
}
