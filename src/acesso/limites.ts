// Defesas da porta de entrada (capítulo 9). Por IP: express-rate-limit.
// Por conta: contador de FALHAS, nosso, com duas janelas.
import type { Request } from "express";
import { rateLimit } from "express-rate-limit";
import { TooManyRequestsError } from "../compartilhado/erros.js";

const MIN = 60 * 1000;

/** Qualquer pedido às rotas de autenticação: 100 por IP a cada 15 min. */
export const porIp = rateLimit({
  windowMs: 15 * MIN, limit: 100,
  standardHeaders: "draft-8", legacyHeaders: false,
  handler: (_req, _res, next, o) => next(new TooManyRequestsError(o.windowMs / 1000)),
});

// Falhas de senha. "conta+ip" pega o ataque concentrado sem deixar
// um atacante trancar a vítima de outro lugar; "conta" pega o ataque
// espalhado por muitos IPs.
const REGRAS = [
  { nome: "conta+ip", limite: 5, janelaMs: 15 * MIN },
  { nome: "conta", limite: 50, janelaMs: 60 * MIN },
] as const;
type Janela = { falhas: number; ate: number };
const janelas = new Map<string, Janela>();

const chave = (regra: string, email: string, ip: string) =>
  regra === "conta" ? `conta:${email}` : `conta+ip:${email}|${ip}`;
const normal = (email: string) => email.trim().toLowerCase();

/** Segundos até liberar, se alguma regra estourou. */
export function bloqueio(email: string, req: Request): number | undefined {
  const agora = Date.now();
  for (const r of REGRAS) {
    const j = janelas.get(chave(r.nome, normal(email), req.ip ?? ""));
    if (j && j.ate > agora && j.falhas >= r.limite) return Math.ceil((j.ate - agora) / 1000);
  }
  return undefined;
}

export function registrarFalha(email: string, req: Request) {
  const agora = Date.now();
  for (const r of REGRAS) {
    const k = chave(r.nome, normal(email), req.ip ?? "");
    const j = janelas.get(k);
    if (!j || j.ate <= agora) janelas.set(k, { falhas: 1, ate: agora + r.janelaMs });
    else j.falhas++;
  }
}

/** Senha certa: zera as falhas daquela conta naquele IP. */
export function limparFalhas(email: string, req: Request) {
  janelas.delete(chave("conta+ip", normal(email), req.ip ?? ""));
}

export const zerarLimites = () => janelas.clear();
