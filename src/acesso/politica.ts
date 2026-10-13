// Toda rota declara uma política como PRIMEIRO middleware.
// O censo (scripts/censo.ts e tests/censo.test.ts) lê esta marca.
import type { RequestHandler } from "express";
import type { Usuario } from "./usuarios.js";
import { ForbiddenError, UnauthorizedError } from "../compartilhado/erros.js";
import { identificar } from "./identidade.js";
import { pode, type Permissao } from "./permissoes.js";

declare global {
  namespace Express { interface Request { usuario?: Usuario } }
}

export const MARCA = Symbol("politica");
export type Politica =
  | { publica: true } | { autenticada: true } | { permissao: Permissao };
export type Marcado = RequestHandler & { [MARCA]: Politica };

const marcar = (h: RequestHandler, p: Politica) =>
  Object.assign(h, { [MARCA]: p }) as Marcado;

export const publica = () => marcar((_req, _res, next) => next(), { publica: true });

// Basta estar logado (ex.: logout, "quem sou eu").
export const autenticada = () =>
  marcar(async (req, _res, next) => {
    const usuario = await identificar(req);
    if (!usuario) throw new UnauthorizedError();
    req.usuario = usuario;
    next();
  }, { autenticada: true });

export const exige = (permissao: Permissao) =>
  marcar(async (req, _res, next) => {
    const usuario = await identificar(req);                       // portão 1
    if (!usuario) throw new UnauthorizedError();
    if (!pode(usuario.papel, permissao)) throw new ForbiddenError(); // portão 2
    req.usuario = usuario;
    next();
  }, { permissao });
