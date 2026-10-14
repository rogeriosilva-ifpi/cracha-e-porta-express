import type { Express } from "express";
import { z } from "zod";
import { exige } from "../acesso/politica.js";
import { registrar as evento } from "../compartilhado/eventos.js";
import { revogarTodas } from "../acesso/refresh.js";
import { revogarChavesDe } from "../acesso/chaves.js";
import { encerrarTodas } from "../acesso/sessoes.js";
import { hashSenha, motivoDeRecusa } from "../acesso/senhas.js";
import { BadRequestError, NotFoundError } from "../compartilhado/erros.js";
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
    res.json(usuarios.listar().map(publico));   // nunca o hash
  });

  app.post("/api/admin/users", exige("user:admin"), async (req, res) => {
    const { senha, ...dados } = NovoUsuario.parse(req.body);
    const motivo = motivoDeRecusa(senha, dados.email);
    if (motivo) throw new BadRequestError(motivo);
    const u = usuarios.criar({
      id: novoId("u"), ...dados, passwordHash: await hashSenha(senha),
    });
    res.status(201).json(publico(u));
  });

  // Desligamento: derruba sessões, apps e chaves de API. Função administrativa:
  // permissão declarada, não "o botão só aparece para o admin".
  app.post("/api/admin/users/:id/desligar", exige("user:admin"), (req, res) => {
    const u = usuarios.porId(String(req.params.id));
    if (!u) throw new NotFoundError();
    encerrarTodas(u.id);
    revogarTodas(u.id);
    revogarChavesDe(u.id);
    evento("usuario_desligado", { usuario: u.id, por: req.usuario!.id });
    res.status(204).end();
  });

  // Troca de papel: permissão declarada; derruba sessões, apps e chaves
  // da pessoa, para nenhum token ou tela antiga carregar o papel velho.
  app.patch("/api/admin/users/:id/papel", exige("user:admin"), (req, res) => {
    const { papel } = z.object({ papel: z.enum(["admin", "profissional", "recepcao"]) })
      .parse(req.body);
    const u = usuarios.porId(String(req.params.id));
    if (!u) throw new NotFoundError();
    usuarios.trocarPapel(u.id, papel);
    encerrarTodas(u.id);
    revogarTodas(u.id);
    revogarChavesDe(u.id);
    evento("papel_alterado", { usuario: u.id, de: u.papel, para: papel, por: req.usuario!.id });
    res.json(publico(usuarios.porId(u.id)!));
  });
}
