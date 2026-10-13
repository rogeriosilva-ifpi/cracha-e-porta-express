// Tradução de erros: o ÚNICO lugar que monta resposta de erro.
// Falha fechado: o que não reconhecemos vira 500 genérico.
import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { HttpError, NotFoundError } from "../compartilhado/erros.js";

export const rotaInexistente: RequestHandler = () => {
  throw new NotFoundError("Rota não encontrada.");
};

export const tratarErros: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
  } else if (err instanceof ZodError) {
    res.status(400).json({ error: "Dados inválidos.", campos: err.issues.map((i) => i.path.join(".")) });
  } else if (err?.type === "entity.parse.failed") {
    res.status(400).json({ error: "JSON malformado." });
  } else {
    console.error(err);                       // detalhe só no log do servidor
    res.status(500).json({ error: "Erro interno." });
  }
};
