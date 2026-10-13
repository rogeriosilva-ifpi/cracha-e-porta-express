// Senhas: argon2id lento de propósito + política NIST SP 800-63B-4.
import argon2 from "argon2";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";

export const PARAMS = {
  type: argon2.argon2id,
  memoryCost: 19456, // KiB = 19 MiB (mínimo OWASP)
  timeCost: 2,
  parallelism: 1,
} as const;

export const hashSenha = (senha: string) => argon2.hash(senha, PARAMS);

export const verificarSenha = (hash: string, senha: string) =>
  argon2.verify(hash, senha);

// Hash criado com parâmetros antigos? Refaça no próximo login.
export const precisaRehash = (hash: string) =>
  argon2.needsRehash(hash, PARAMS);

// Verificado quando o e-mail NÃO existe, para o tempo não denunciar.
export const HASH_FICTICIO = await hashSenha(randomBytes(32).toString("hex"));

const BLOQUEIO = new Set(
  readFileSync(new URL("../../dados/senhas-comuns.txt", import.meta.url), "utf8")
    .split("\n").map((l) => l.trim().toLowerCase())
    .filter((l) => l && !l.startsWith("#")));

export const MIN = 15, MAX = 256;

/** Devolve o motivo da recusa, ou null se a senha é aceitável. */
export function motivoDeRecusa(senha: string, email: string): string | null {
  if (senha.length < MIN) return `A senha precisa ter ao menos ${MIN} caracteres.`;
  if (senha.length > MAX) return `A senha pode ter no máximo ${MAX} caracteres.`;
  const s = senha.toLowerCase();
  if (BLOQUEIO.has(s)) return "Essa senha é comum demais. Escolha outra.";
  const nome = email.split("@")[0]!.toLowerCase();
  if (s.includes(nome) || s.includes("prontuario"))
    return "A senha não pode conter seu e-mail nem o nome do sistema.";
  return null;
}
