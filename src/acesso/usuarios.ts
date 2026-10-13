// Repositório de usuários. Toda consulta é parametrizada (?).
import { banco } from "../compartilhado/banco.js";
import type { Papel } from "../compartilhado/dados.js";
import argon2 from "argon2";
import { hashSenha } from "./senhas.js";

export interface Usuario {
  id: string; nome: string; email: string;
  papel: Papel; passwordHash: string;
}
type Linha = Omit<Usuario, "passwordHash"> & { password_hash: string };
const deLinha = ({ password_hash, ...u }: Linha): Usuario =>
  ({ ...u, passwordHash: password_hash });

export const publico = ({ passwordHash: _, ...u }: Usuario) => u;

export const usuarios = {
  porEmail(email: string) {
    const r = banco.prepare("SELECT * FROM usuarios WHERE email = ?")
      .get(email.toLowerCase()) as Linha | undefined;
    return r && deLinha(r);
  },
  porId(id: string) {
    const r = banco.prepare("SELECT * FROM usuarios WHERE id = ?")
      .get(id) as Linha | undefined;
    return r && deLinha(r);
  },
  listar() {
    return (banco.prepare("SELECT * FROM usuarios").all() as Linha[]).map(deLinha);
  },
  criar(u: Usuario) {
    banco.prepare(`INSERT INTO usuarios (id, nome, email, papel, password_hash)
                   VALUES (?, ?, ?, ?, ?)`)
      .run(u.id, u.nome, u.email.toLowerCase(), u.papel, u.passwordHash);
    return u;
  },
  trocarPapel(id: string, papel: Papel) {
    banco.prepare("UPDATE usuarios SET papel = ? WHERE id = ?").run(papel, id);
  },
  trocarHash(id: string, hash: string) {
    banco.prepare("UPDATE usuarios SET password_hash = ? WHERE id = ?").run(hash, id);
  },
};

// Senhas de LABORATÓRIO, documentadas no README. Nunca faça isso em produção.
export const SENHAS_DE_LABORATORIO: Record<string, string> = {
  "admin@hospital.dev": "farol-de-amarracao-2026",
  "ana@hospital.dev": "cajueiro-em-flor-no-quintal",
  "bruno@hospital.dev": "barco-azul-no-delta",
  "carla@hospital.dev": "rede-na-varanda-de-tarde",
  "eva@hospital.dev": "mangueira-no-fim-da-rua",
};
// Segredo TOTP de LABORATÓRIO da Dra. Eva (capítulo 8), no README.
export const TOTP_DE_LABORATORIO = "5SCWGB6S2EW3ODL6YVCBVS4HUJDGETQJ";

const SEMENTE: Omit<Usuario, "passwordHash">[] = [
  { id: "u1", nome: "Admin Geral", email: "admin@hospital.dev", papel: "admin" },
  { id: "u2", nome: "Dra. Ana", email: "ana@hospital.dev", papel: "profissional" },
  { id: "u3", nome: "Dr. Bruno", email: "bruno@hospital.dev", papel: "profissional" },
  { id: "u4", nome: "Carla", email: "carla@hospital.dev", papel: "recepcao" },
  { id: "u5", nome: "Dra. Eva", email: "eva@hospital.dev", papel: "profissional" },
];

if ((banco.prepare("SELECT COUNT(*) AS n FROM usuarios").get() as { n: number }).n === 0) {
  for (const u of SEMENTE) {
    const senha = SENHAS_DE_LABORATORIO[u.email]!;
    // Bruno foi cadastrado num sistema antigo, com parâmetros fracos:
    // o login dele mostra o rehash transparente (capítulo 4).
    const hash = u.id === "u3"
      ? await argon2.hash(senha, { type: argon2.argon2id, memoryCost: 4096, timeCost: 1, parallelism: 1 })
      : await hashSenha(senha);
    usuarios.criar({ ...u, passwordHash: hash });
  }
  // Eva já usa segundo fator; Ana tem login federado vinculado (cap. 8).
  banco.prepare("INSERT INTO mfa VALUES ('u5', ?, 1, 0)").run(TOTP_DE_LABORATORIO);
  banco.prepare("INSERT INTO identidades_externas VALUES (?, 'ana-no-provedor', 'u2')")
    .run(process.env.OIDC_ISSUER ?? "http://localhost:8080/realms/hospital");
}
