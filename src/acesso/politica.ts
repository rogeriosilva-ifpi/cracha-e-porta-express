// Toda rota declara uma política como PRIMEIRO middleware.
// O censo (scripts/censo.ts e tests/censo.test.ts) lê esta marca.
import type { RequestHandler } from "express";
import type { Usuario } from "../compartilhado/dados.js";
import { ForbiddenError, UnauthorizedError } from "../compartilhado/erros.js";
import { identificar } from "./cracha-provisorio.js";
import { pode, type Permissao } from "./permissoes.js";

declare global {
  namespace Express { interface Request { usuario?: Usuario } }
}

export const MARCA = Symbol("politica");
export type Politica = { publica: true } | { permissao: Permissao };
export type Marcado = RequestHandler & { [MARCA]: Politica };

const marcar = (h: RequestHandler, p: Politica) =>
  Object.assign(h, { [MARCA]: p }) as Marcado;

export const publica = () => marcar((_req, _res, next) => next(), { publica: true });

export const exige = (permissao: Permissao) =>
  marcar((req, _res, next) => {
    const usuario = identificar(req);                       // portão 1
    if (!usuario) throw new UnauthorizedError();
    if (!pode(usuario.papel, permissao)) throw new ForbiddenError(); // portão 2
    req.usuario = usuario;
    next();
  }, { permissao });
