// Rotas de chaves de API e metadados do recurso protegido (cap. 15).
import type { Express } from "express";
import { z } from "zod";
import { autenticada, publica } from "../acesso/politica.js";
import { criarChave, listarChaves, MAX_ATIVAS, MAX_DIAS, revogarChave } from "../acesso/chaves.js";
import { MATRIZ, pode, type Permissao } from "../acesso/permissoes.js";
import { EMISSOR } from "../acesso/tokens.js";
import { registrar as evento } from "../compartilhado/eventos.js";
import { BadRequestError, ForbiddenError, NotFoundError } from "../compartilhado/erros.js";

export const RECURSO = `${EMISSOR}/api`;
export const METADADOS_URL = `${EMISSOR}/.well-known/oauth-protected-resource`;
const TODAS = [...new Set(Object.values(MATRIZ).flat())] as [Permissao, ...Permissao[]];

const NovaChave = z.object({
  nome: z.string().min(3).max(60),
  escopos: z.array(z.enum(TODAS)).min(1),          // nada de "*"
  dias: z.number().int().min(1).max(MAX_DIAS).default(30),
}).strict();

export function registrar(app: Express) {
  app.post("/api/auth/chaves", autenticada(), (req, res) => {
    const u = req.usuario!;
    const { nome, escopos, dias } = NovaChave.parse(req.body);
    // Ninguém delega o que não tem: escopo é subconjunto do papel.
    const alem = escopos.filter((e) => !pode(u.papel, e));
    if (alem.length) throw new ForbiddenError(`Escopo além do seu papel: ${alem.join(", ")}.`);
    if (listarChaves(u.id).length >= MAX_ATIVAS)
      throw new BadRequestError(`Limite de ${MAX_ATIVAS} chaves ativas.`);
    const nova = criarChave(u.id, nome, [...new Set(escopos)], dias);
    evento("chave_criada", { usuario: u.id, chave: nova.id, escopos: nova.escopos });
    res.status(201).json(nova);          // a única vez em que a chave aparece
  });

  app.get("/api/auth/chaves", autenticada(), (req, res) => {
    res.json(listarChaves(req.usuario!.id));
  });

  app.delete("/api/auth/chaves/:id", autenticada(), (req, res) => {
    const u = req.usuario!;
    if (!revogarChave(String(req.params.id), u.id)) throw new NotFoundError();
    evento("chave_revogada", { usuario: u.id, chave: String(req.params.id) });
    res.status(204).end();
  });

  // RFC 9728: o recurso se descreve. Cliente e agente descobrem aqui
  // quem emite credenciais para ele e quais escopos existem.
  app.get("/.well-known/oauth-protected-resource", publica(), (_req, res) => {
    res.json({
      resource: RECURSO,
      authorization_servers: [EMISSOR],
      bearer_methods_supported: ["header"],
      scopes_supported: TODAS,
      resource_name: "Mini-Prontuário API",
    });
  });
}
