// Eventos de segurança (capítulo 9): uma linha JSON por evento.
// Nunca senha, token, código ou corpo de requisição.
import { createHash } from "node:crypto";

export type Evento =
  | "login_ok" | "login_falhou" | "conta_limitada" | "mfa_falhou"
  | "refresh_reutilizado" | "senha_redefinida" | "saiu_de_todos";

type Dados = { usuario?: string; conta?: string; ip?: string; [k: string]: unknown };
let saida = (linha: string) => console.info(linha);
/** Os testes capturam as linhas em vez de imprimir. */
export const usarSaida = (f: (linha: string) => void) => { saida = f; };

export function registrar(evento: Evento, dados: Dados = {}) {
  saida(JSON.stringify({ quando: new Date().toISOString(), evento, ...dados }));
}

/** Correlaciona tentativas contra um e-mail sem gravar o e-mail. */
export const contaAnonima = (email: string) =>
  createHash("sha256").update(email.trim().toLowerCase()).digest("hex").slice(0, 12);
