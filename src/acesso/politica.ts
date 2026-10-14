// Toda rota declara uma política como PRIMEIRO middleware.
// O censo (scripts/censo.ts e tests/censo.test.ts) lê esta marca.
import type { RequestHandler } from "express";
import type { Usuario } from "./usuarios.js";
import { ForbiddenError, UnauthorizedError } from "../compartilhado/erros.js";
import { identificar } from "./identidade.js";
import { pode, type Permissao } from "./permissoes.js";
import { registrar as evento } from "../compartilhado/eventos.js";

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

// Basta estar logado (ex.: logout, "quem sou eu"). São funções da
// própria conta: gente entra, chave de API não (capítulo 15).
export const autenticada = () =>
  marcar(async (req, _res, next) => {
    const usuario = await identificar(req);
    if (!usuario) throw new UnauthorizedError();
    if (req.chave) throw new ForbiddenError("Chave de API não gerencia a conta.");
    req.usuario = usuario;
    next();
  }, { autenticada: true });

export const exige = (permissao: Permissao) =>
  marcar(async (req, _res, next) => {
    const usuario = await identificar(req);                       // portão 1
    if (!usuario) throw new UnauthorizedError();
    if (!pode(usuario.papel, permissao))                     // portão 2
      throw new ForbiddenError("Permissão insuficiente.");
    const k = req.chave;                                 // veio por chave?
    if (k && !k.escopos.includes(permissao)) {           // portão 2b
      evento("chave_fora_do_escopo", { chave: k.id, permissao });
      throw new ForbiddenError("Fora do escopo da chave.");
    }
    req.usuario = usuario;
    next();
  }, { permissao });
