// Chaves de API com escopo (capítulo 15): a credencial de máquinas,
// scripts e agentes. Age em nome de uma pessoa, mas só com o
// subconjunto de permissões que ela escolheu, e por tempo limitado.
import { createHash, randomBytes } from "node:crypto";
import { banco } from "../compartilhado/banco.js";
import type { Permissao } from "./permissoes.js";

export const MAX_DIAS = 90;
export const MAX_ATIVAS = 10;
// sha256 basta: o segredo tem 256 bits aleatórios, não é uma senha
// escolhida por gente. Não há dicionário para testar contra ele.
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const FORMATO = /^mp_([0-9a-f]{8})_([A-Za-z0-9_-]{43})$/;

type Linha = {
  id: string; usuario_id: string; nome: string; escopos: string;
  criada_em: number; expira_em: number; ultimo_uso: number | null;
};
export type ChaveVisivel = {
  id: string; nome: string; escopos: Permissao[];
  criada_em: number; expira_em: number; ultimo_uso: number | null;
};
const visivel = (l: Linha): ChaveVisivel => ({
  id: l.id, nome: l.nome, escopos: JSON.parse(l.escopos),
  criada_em: l.criada_em, expira_em: l.expira_em, ultimo_uso: l.ultimo_uso,
});

/** Cria a chave. O texto dela sai daqui uma única vez. */
export function criarChave(usuarioId: string, nome: string,
                           escopos: Permissao[], dias: number) {
  const id = randomBytes(4).toString("hex");
  const chave = `mp_${id}_${randomBytes(32).toString("base64url")}`;
  const agora = Date.now();
  banco.prepare(`INSERT INTO chaves_api (id, hash, usuario_id, nome, escopos,
    criada_em, expira_em) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(id, sha256(chave), usuarioId, nome, JSON.stringify(escopos),
         agora, agora + dias * 24 * 3600 * 1000);
  return { chave, ...visivel(banco.prepare("SELECT * FROM chaves_api WHERE id = ?").get(id) as Linha) };
}

/** Confere a chave: formato, hash, revogação e validade. */
export function verificarChave(chave: string) {
  const m = FORMATO.exec(chave);
  if (!m) return undefined;                           // nem vai ao banco
  const l = banco.prepare(`SELECT * FROM chaves_api
    WHERE id = ? AND hash = ? AND revogada = 0 AND expira_em > ?`)
    .get(m[1], sha256(chave), Date.now()) as Linha | undefined;
  if (!l) return undefined;
  banco.prepare("UPDATE chaves_api SET ultimo_uso = ? WHERE id = ?").run(Date.now(), l.id);
  return { usuarioId: l.usuario_id, id: l.id, escopos: JSON.parse(l.escopos) as Permissao[] };
}

/** Só as chaves da própria pessoa; nunca o hash. */
export const listarChaves = (usuarioId: string) =>
  (banco.prepare(`SELECT * FROM chaves_api WHERE usuario_id = ? AND revogada = 0
    AND expira_em > ? ORDER BY criada_em`).all(usuarioId, Date.now()) as Linha[]).map(visivel);

/** Revoga uma chave da própria pessoa. A de outro "não existe". */
export const revogarChave = (id: string, usuarioId: string) =>
  banco.prepare("UPDATE chaves_api SET revogada = 1 WHERE id = ? AND usuario_id = ? AND revogada = 0")
    .run(id, usuarioId).changes === 1;

/** Desligamento e troca de papel: as chaves vão junto. */
export const revogarChavesDe = (usuarioId: string) =>
  banco.prepare("UPDATE chaves_api SET revogada = 1 WHERE usuario_id = ?").run(usuarioId);
