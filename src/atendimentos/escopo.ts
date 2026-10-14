// Portão 3 (capítulo 12): quais atendimentos cada pessoa vê, e com
// quanto detalhe. A regra vira consulta: nunca "busca e confere depois".
import type { Usuario } from "../acesso/usuarios.js";
import { pode } from "../acesso/permissoes.js";
import { db, type Atendimento } from "../compartilhado/dados.js";
import { NotFoundError } from "../compartilhado/erros.js";

/** Os atendimentos que esta pessoa pode ver (a "consulta escopada"). */
export const visiveis = (u: Usuario): Atendimento[] =>
  pode(u.papel, "encounter:read_any")
    ? db.atendimentos                                         // lista geral
    : db.atendimentos.filter((a) => a.profissionalId === u.id); // só os seus

/** Busca DENTRO do escopo: o que não é visível nem existe (404). */
export function buscarVisivel(u: Usuario, id: string): Atendimento {
  const a = visiveis(u).find((x) => x.id === id);
  if (!a) throw new NotFoundError();
  return a;
}

/** Saída por quem pede: dado clínico só para o autor do atendimento. */
export const saida = (u: Usuario, a: Atendimento) =>
  a.profissionalId === u.id
    ? a
    : { id: a.id, pacienteId: a.pacienteId, profissionalId: a.profissionalId, status: a.status };
