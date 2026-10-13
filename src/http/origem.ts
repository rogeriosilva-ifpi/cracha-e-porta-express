// Defesa contra CSRF: ação vinda de outro site é recusada (capítulo 5).
import type { RequestHandler } from "express";
import { ForbiddenError } from "../compartilhado/erros.js";

const SEGUROS = new Set(["GET", "HEAD", "OPTIONS"]);

export const verificarOrigem = (origens: string[]): RequestHandler =>
  (req, _res, next) => {
    if (SEGUROS.has(req.method)) return next();
    const origem = req.get("Origin");
    if (origem && !origens.includes(origem))
      throw new ForbiddenError("Origem não permitida.");
    if (req.get("Sec-Fetch-Site") === "cross-site")
      throw new ForbiddenError("Origem não permitida.");
    next();
  };
