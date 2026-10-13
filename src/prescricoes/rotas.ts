import type { Express } from "express";
import { z } from "zod";
import { db, novoId } from "../compartilhado/dados.js";
import { exige } from "../acesso/politica.js";
import { NotFoundError } from "../compartilhado/erros.js";

const NovaPrescricao = z.object({
  medicamento: z.string().min(2),
  posologia: z.string().min(2),
  profissionalId: z.string(), // quem prescreve vem do corpo (por enquanto)
});

export function registrar(app: Express) {
  app.get("/api/medication-requests", exige("rx:read"), (req, res) => {
    const { encounterId } = req.query;
    res.json(encounterId
      ? db.prescricoes.filter((m) => m.atendimentoId === encounterId)
      : db.prescricoes);
  });

  app.post("/api/encounters/:id/medication-requests", exige("rx:create"), (req, res) => {
    const e = db.atendimentos.find((x) => x.id === req.params.id);
    if (!e) throw new NotFoundError();
    const dados = NovaPrescricao.parse(req.body);
    const m = { id: novoId("m"), atendimentoId: e.id, ...dados };
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
