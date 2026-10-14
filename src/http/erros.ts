// Tradução de erros: o ÚNICO lugar que monta resposta de erro.
// Falha fechado: o que não reconhecemos vira 500 genérico.
import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { HttpError, NotFoundError, TooManyRequestsError, UnauthorizedError } from "../compartilhado/erros.js";
import { METADADOS_URL } from "../auth/chaves.js";

export const rotaInexistente: RequestHandler = () => {
  throw new NotFoundError("Rota não encontrada.");
};

export const tratarErros: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    if (err instanceof TooManyRequestsError) res.set("Retry-After", String(err.retryAfterS));
    // RFC 9728: o 401 diz ao cliente (ou agente) onde ler como se autenticar.
    if (err instanceof UnauthorizedError)
      res.set("WWW-Authenticate", `Bearer resource_metadata="${METADADOS_URL}"`);
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
