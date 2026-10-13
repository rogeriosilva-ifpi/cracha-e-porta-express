// Ponto de decisão de acesso (capítulo 10): a mesma regra em três
// modelos, para comparar. O contrato é sempre o mesmo:
// autorizar(sujeito, ação, recurso, contexto) -> { permitido, motivo }.
import { escala, type Papel } from "../compartilhado/dados.js";
import { pode } from "./permissoes.js";

export type Sujeito = { id: string; papel: Papel; suspenso?: boolean };
export type Recurso = { id: string; autor: string; status: "aberto" | "finalizado" };
export type Contexto = { de_plantao: boolean };
export type Decisao = { permitido: boolean; motivo: string };
export type Modelo = (s: Sujeito, r: Recurso, c: Contexto) => Decisao;

const sim = (motivo: string): Decisao => ({ permitido: true, motivo });
const nao = (motivo: string): Decisao => ({ permitido: false, motivo });

/** RBAC puro: só o papel importa. */
export const rbac: Modelo = (s) =>
  pode(s.papel, "rx:create") ? sim("papel com rx:create") : nao("papel sem rx:create");

/** RBAC com posse: papel + ser o autor do atendimento. */
export const rbacComPosse: Modelo = (s, r) => {
  if (!pode(s.papel, "rx:create")) return nao("papel sem rx:create");
  return r.autor === s.id ? sim("autor do atendimento") : nao("não é o autor do atendimento");
};

/** ABAC: atributos do sujeito, do recurso e do ambiente. */
export const abac: Modelo = (s, r, c) => {
  if (s.suspenso) return nao("registro suspenso");
  if (!pode(s.papel, "rx:create")) return nao("papel sem rx:create");
  if (r.autor !== s.id) return nao("não é o autor do atendimento");
  if (r.status !== "aberto") return nao("atendimento finalizado");
  if (!c.de_plantao) return nao("fora do plantão");
  return sim("autor, atendimento aberto, de plantão");
};

/** Fonte de atributo do ambiente: está de plantão agora? */
export function dePlantao(usuarioId: string, agora: Date): boolean {
  const minutos = (h: string) => { const [a, b] = h.split(":").map(Number); return a! * 60 + b!; };
  const m = agora.getHours() * 60 + agora.getMinutes();
  return escala.some((p) => {
    if (p.usuarioId !== usuarioId) return false;
    const [ini, fim] = [minutos(p.inicio), minutos(p.fim)];
    return ini < fim ? m >= ini && m < fim     // 07:00–19:00
                     : m >= ini || m < fim;    // 19:00–07:00 vira a meia-noite
  });
}
