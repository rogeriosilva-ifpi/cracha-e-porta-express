// Matriz de permissões do Mini-Prontuário (capítulo 3).
// Fonte única: rotas e testes leem daqui. O cap. 11 discute quando
// ela deve sair do código e ir para o banco.
import type { Papel } from "../compartilhado/dados.js";

export type Permissao =
  | "patient:read" | "patient:create"
  | "encounter:read" | "encounter:read_any" | "encounter:update"
  | "rx:read" | "rx:create"
  | "user:admin";

export const MATRIZ: Record<Papel, readonly Permissao[]> = {
  admin: ["patient:read", "patient:create", "encounter:read",
          "encounter:read_any", "encounter:update", "rx:read", "user:admin"],
  profissional: ["patient:read", "patient:create", "encounter:read",
                 "encounter:update", "rx:read", "rx:create"],
  recepcao: ["patient:read", "patient:create", "encounter:read",
             "encounter:read_any"],
};

export const pode = (papel: Papel, p: Permissao) => MATRIZ[papel].includes(p);
