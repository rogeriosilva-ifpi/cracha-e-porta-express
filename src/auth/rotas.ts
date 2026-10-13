// Login. VERSÃO INGÊNUA (tag cap04-antes): veja o capítulo 4.
import type { Express } from "express";
import { z } from "zod";
import { publica } from "../acesso/politica.js";
import { verificarSenha } from "../acesso/senhas.js";
import { usuarios } from "../acesso/usuarios.js";
import { NotFoundError, UnauthorizedError } from "../compartilhado/erros.js";

const Login = z.object({ email: z.string(), senha: z.string() });

export function registrar(app: Express) {
  app.post("/api/auth/login", publica(), async (req, res) => {
    const { email, senha } = Login.parse(req.body);
    const u = usuarios.porEmail(email);
    if (!u) throw new NotFoundError("E-mail não cadastrado.");
    if (!(await verificarSenha(u.passwordHash, senha)))
      throw new UnauthorizedError("Senha incorreta.");
    res.json({ usuario: u });
  });
}
