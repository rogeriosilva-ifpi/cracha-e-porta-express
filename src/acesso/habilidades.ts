// A mesma matriz com CASL (capítulo 11), a biblioteca de autorização
// mais usada em JavaScript: ação + assunto, e condições sobre o objeto.
import {
  AbilityBuilder, createMongoAbility, type MongoAbility,
} from "@casl/ability";
import type { Papel } from "../compartilhado/dados.js";
import { MATRIZ, type Permissao } from "./permissoes.js";

export type Acao = "read" | "create" | "update" | "manage" | "prescrever";
export type Assunto = "Paciente" | "Atendimento" | "Prescricao" | "Usuario";
export type Habilidades = MongoAbility<[Acao, Assunto | object]>;

// Cada permissão da matriz vira um par (ação, assunto).
export const TRADUCAO: Record<Permissao, [Acao, Assunto]> = {
  "patient:read": ["read", "Paciente"],
  "patient:create": ["create", "Paciente"],
  "encounter:read": ["read", "Atendimento"],
  "encounter:update": ["update", "Atendimento"],
  "rx:read": ["read", "Prescricao"],
  "rx:create": ["create", "Prescricao"],
  "user:admin": ["manage", "Usuario"],
};

export function habilidades(u: { id: string; papel: Papel }): Habilidades {
  const { can, build } = new AbilityBuilder<Habilidades>(createMongoAbility);
  for (const p of MATRIZ[u.papel]) can(...TRADUCAO[p]);
  // Condição sobre o objeto: prescrever só no próprio atendimento aberto.
  if (MATRIZ[u.papel].includes("rx:create"))
    can("prescrever", "Atendimento", { profissionalId: u.id, status: "aberto" });
  return build();
}
