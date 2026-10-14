import type { Express } from "express";
import { z } from "zod";
import { db, novoId } from "../compartilhado/dados.js";
import { exige } from "../acesso/politica.js";
import { ForbiddenError } from "../compartilhado/erros.js";
import { registrar as evento } from "../compartilhado/eventos.js";
import { abac, dePlantao } from "../acesso/decisao.js";
import { buscarVisivel, visiveis } from "../atendimentos/escopo.js";

// Quem prescreve vem da sessão, nunca do corpo.
const NovaPrescricao = z.object({
  medicamento: z.string().min(2),
  posologia: z.string().min(2),
}).strict();

export function registrar(app: Express) {
  app.get("/api/medication-requests", exige("rx:read"), (req, res) => {
    const meus = new Set(visiveis(req.usuario!).map((a) => a.id));   // escopo
    const { encounterId } = req.query;
    res.json(db.prescricoes.filter((m) => meus.has(m.atendimentoId)
      && (!encounterId || m.atendimentoId === encounterId)));
  });

  app.post("/api/encounters/:id/medication-requests", exige("rx:create"), (req, res) => {
    const u = req.usuario!;
    const a = buscarVisivel(u, String(req.params.id));          // 404
    const d = abac(                                              // cap. 10
      { id: u.id, papel: u.papel },
      { id: a.id, autor: a.profissionalId, status: a.status },
      { de_plantao: dePlantao(u.id, new Date()) });
    if (!d.permitido) {
      evento("acesso_negado", { usuario: u.id, recurso: a.id, motivo: d.motivo });
      throw new ForbiddenError();                                // motivo só no evento
    }
    const m = { id: novoId("m"), atendimentoId: a.id, profissionalId: u.id,
                ...NovaPrescricao.parse(req.body) };
    db.prescricoes.push(m);
    res.status(201).json(m);
  });

  // Relatório: prescrições por profissional. A permissão mora na matriz.
  app.get("/api/reports/prescriptions", exige("rx:read"), (_req, res) => {
    const porProfissional: Record<string, number> = {};
    for (const m of db.prescricoes)
      porProfissional[m.profissionalId] = (porProfissional[m.profissionalId] ?? 0) + 1;
    res.json(porProfissional);
  });
}
