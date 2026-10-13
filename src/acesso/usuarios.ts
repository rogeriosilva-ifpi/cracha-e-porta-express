// Repositório de usuários. Toda consulta é parametrizada (?).
import { banco } from "../compartilhado/banco.js";
import type { Papel } from "../compartilhado/dados.js";
import { hashSenha } from "./senhas.js";

export interface Usuario {
  id: string; nome: string; email: string;
  papel: Papel; passwordHash: string;
}
type Linha = Omit<Usuario, "passwordHash"> & { password_hash: string };
const deLinha = ({ password_hash, ...u }: Linha): Usuario =>
  ({ ...u, passwordHash: password_hash });

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
};

const SEMENTE: Omit<Usuario, "passwordHash">[] = [
  { id: "u1", nome: "Admin Geral", email: "admin@hospital.dev", papel: "admin" },
  { id: "u2", nome: "Dra. Ana", email: "ana@hospital.dev", papel: "profissional" },
  { id: "u3", nome: "Dr. Bruno", email: "bruno@hospital.dev", papel: "profissional" },
  { id: "u4", nome: "Carla", email: "carla@hospital.dev", papel: "recepcao" },
];

if ((banco.prepare("SELECT COUNT(*) AS n FROM usuarios").get() as { n: number }).n === 0) {
  for (const u of SEMENTE)
    usuarios.criar({ ...u, passwordHash: await hashSenha(SENHAS_DE_LABORATORIO[u.email]!) });
}
