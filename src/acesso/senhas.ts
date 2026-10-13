// Hash de senha: argon2id, lento de propósito (capítulo 4).
import argon2 from "argon2";

export const PARAMS = {
  type: argon2.argon2id,
  memoryCost: 19456, // KiB = 19 MiB
  timeCost: 2,
  parallelism: 1,
} as const;

export const hashSenha = (senha: string) => argon2.hash(senha, PARAMS);

export const verificarSenha = (hash: string, senha: string) =>
  argon2.verify(hash, senha);
