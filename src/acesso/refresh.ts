// Refresh tokens opacos, em famílias, com rotação e detecção de
// reuso (capítulo 7). Família = um login de app num dispositivo.
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { banco } from "../compartilhado/banco.js";
import { registrar } from "../compartilhado/eventos.js";

export const REFRESH_MS = 7 * 24 * 3600 * 1000;   // parado 7 dias: morre
export const FAMILIA_MS = 30 * 24 * 3600 * 1000;  // 30 dias: login de novo
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

type Familia = { id: string; usuario_id: string };
type Refresh = { familia: string; usado: number };

function novoRefresh(familia: string) {
  const token = randomBytes(32).toString("base64url");
  banco.prepare("INSERT INTO refresh_tokens VALUES (?, ?, ?, 0)")
    .run(sha256(token), familia, Date.now() + REFRESH_MS);
  return token;
}

/** Login de app: abre uma família e entrega o primeiro refresh. */
export function abrirFamilia(usuarioId: string) {
  const familia = randomUUID();
  const agora = Date.now();
  banco.prepare("INSERT INTO familias VALUES (?, ?, ?, ?, 0)")
    .run(familia, usuarioId, agora, agora + FAMILIA_MS);
  return { familia, refresh: novoRefresh(familia) };
}

export function familiaAtiva(id: string): Familia | undefined {
  return banco.prepare(`SELECT id, usuario_id FROM familias
    WHERE id = ? AND revogada = 0 AND expira_em > ?`)
    .get(id, Date.now()) as Familia | undefined;
}

/** Troca o refresh por um novo. Reuso de um já trocado derruba a família. */
export function girar(token: string) {
  const r = banco.prepare("SELECT familia, usado FROM refresh_tokens WHERE token_hash = ?")
    .get(sha256(token)) as Refresh | undefined;
  const f = r && familiaAtiva(r.familia);
  if (!r || !f) return undefined;
  // UPDATE atômico: de dois pedidos com o mesmo token, só um vence.
  const { changes } = banco.prepare(`UPDATE refresh_tokens SET usado = 1
    WHERE token_hash = ? AND usado = 0 AND expira_em > ?`)
    .run(sha256(token), Date.now());
  if (changes === 0) {
    if (r.usado) {                     // já foi trocado: alguém o copiou
      revogarFamilia(f.id);
      registrar("refresh_reutilizado", { familia: f.id, usuario: f.usuario_id });
    }
    return undefined;
  }
  return { usuarioId: f.usuario_id, familia: f.id, refresh: novoRefresh(f.id) };
}

export function revogarFamilia(id: string) {
  banco.prepare("UPDATE familias SET revogada = 1 WHERE id = ?").run(id);
}

/** "Sair de todos os dispositivos", troca de senha, desligamento. */
export function revogarTodas(usuarioId: string) {
  banco.prepare("UPDATE familias SET revogada = 1 WHERE usuario_id = ?")
    .run(usuarioId);
}
