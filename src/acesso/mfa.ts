// Segundo fator: TOTP (RFC 6238) e códigos de recuperação (capítulo 8).
import * as OTPAuth from "otpauth";
import { createHash, randomBytes } from "node:crypto";
import { banco } from "../compartilhado/banco.js";
import { cifrar, decifrar } from "../compartilhado/cofre.js";

const PERIODO_S = 30;
const DESAFIO_MS = 5 * 60 * 1000;    // entre a senha e o código
const MAX_TENTATIVAS = 5;            // por desafio
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
type Mfa = { segredo: string; ativo: number; ultimo_passo: number };

const totp = (segredo: string, rotulo = "") => new OTPAuth.TOTP({
  issuer: "Mini-Prontuário", label: rotulo, algorithm: "SHA1",
  digits: 6, period: PERIODO_S, secret: OTPAuth.Secret.fromBase32(segredo),
});
// O segredo TOTP é guardado CIFRADO (cap. 13): o banco sozinho não basta.
const linha = (usuarioId: string): Mfa | undefined => {
  const m = banco.prepare("SELECT * FROM mfa WHERE usuario_id = ?").get(usuarioId) as Mfa | undefined;
  return m && { ...m, segredo: decifrar(m.segredo) };
};

export const mfaAtivo = (usuarioId: string) => linha(usuarioId)?.ativo === 1;

/** Passo 1 do cadastro: segredo novo, ainda inativo. */
export function iniciarCadastro(usuarioId: string, email: string) {
  if (mfaAtivo(usuarioId)) return undefined;
  const segredo = new OTPAuth.Secret({ size: 20 }).base32;   // 160 bits
  banco.prepare("INSERT OR REPLACE INTO mfa VALUES (?, ?, 0, 0)").run(usuarioId, cifrar(segredo));
  return { segredo, uri: totp(segredo, email).toString() };   // vira QR code
}

/** Confere o código de 6 dígitos; o mesmo código não vale duas vezes. */
export function conferirTotp(usuarioId: string, codigo: string) {
  const m = linha(usuarioId);
  if (!m) return false;
  const delta = totp(m.segredo).validate({ token: codigo, window: 1 }); // ±30 s
  if (delta === null) return false;
  const passo = Math.floor(Date.now() / 1000 / PERIODO_S) + delta;
  const { changes } = banco.prepare(`UPDATE mfa SET ultimo_passo = ?
    WHERE usuario_id = ? AND ultimo_passo < ?`).run(passo, usuarioId, passo);
  return changes === 1;
}

/** Passo 2 do cadastro: prova que o app gera códigos; entrega os de recuperação. */
export function ativar(usuarioId: string, codigo: string) {
  if (mfaAtivo(usuarioId) || !conferirTotp(usuarioId, codigo)) return undefined;
  banco.prepare("UPDATE mfa SET ativo = 1 WHERE usuario_id = ?").run(usuarioId);
  banco.prepare("DELETE FROM codigos_recuperacao WHERE usuario_id = ?").run(usuarioId);
  return Array.from({ length: 10 }, () => {
    const c = randomBytes(6).toString("hex").match(/.{4}/g)!.join("-");
    banco.prepare("INSERT INTO codigos_recuperacao VALUES (?, ?, 0)").run(sha256(c), usuarioId);
    return c;                                 // mostrado uma única vez
  });
}

function usarRecuperacao(usuarioId: string, codigo: string) {
  const { changes } = banco.prepare(`UPDATE codigos_recuperacao SET usado = 1
    WHERE hash = ? AND usuario_id = ? AND usado = 0`).run(sha256(codigo), usuarioId);
  return changes === 1;
}

/** Senha certa de quem tem MFA: em vez de sessão, um desafio de 5 minutos. */
export function abrirDesafio(usuarioId: string, canal: "cookie" | "token") {
  const desafio = randomBytes(32).toString("base64url");
  banco.prepare("INSERT INTO desafios_mfa VALUES (?, ?, ?, ?, 0)")
    .run(sha256(desafio), usuarioId, canal, Date.now() + DESAFIO_MS);
  return desafio;
}

type Desafio = { usuario_id: string; canal: "cookie" | "token"; expira_em: number; tentativas: number };

/** Resolve o desafio com TOTP ou código de recuperação; 5 tentativas no máximo. */
export function resolverDesafio(desafio: string, codigo: string) {
  const h = sha256(desafio);
  const d = banco.prepare("SELECT * FROM desafios_mfa WHERE hash = ?").get(h) as Desafio | undefined;
  if (!d || d.expira_em < Date.now() || d.tentativas >= MAX_TENTATIVAS) return undefined;
  banco.prepare("UPDATE desafios_mfa SET tentativas = tentativas + 1 WHERE hash = ?").run(h);
  const ok = /^\d{6}$/.test(codigo)
    ? conferirTotp(d.usuario_id, codigo)
    : usarRecuperacao(d.usuario_id, codigo);
  if (!ok) return undefined;
  banco.prepare("DELETE FROM desafios_mfa WHERE hash = ?").run(h);   // uso único
  return { usuarioId: d.usuario_id, canal: d.canal };
}
