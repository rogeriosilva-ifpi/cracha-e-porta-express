// A mesma regra em Cedar (capítulo 10), avaliada dentro do processo.
// O arquivo politicas/prontuario.cedar é compartilhado com o FastAPI.
import { readFileSync } from "node:fs";
import * as cedar from "@cedar-policy/cedar-wasm/nodejs";
import type { Contexto, Decisao, Recurso, Sujeito } from "./decisao.js";

const TEXTO = readFileSync(new URL("../../politicas/prontuario.cedar", import.meta.url), "utf8");
// Cedar numera as políticas na ordem do arquivo (policy0, policy1...);
// o @id de cada uma vira o motivo legível.
const NOMES = [...TEXTO.matchAll(/@id\("([^"]+)"\)/g)].map((m) => m[1]!);
const nome = (id: string) => NOMES[Number(id.replace("policy", ""))] ?? id;

export function autorizarCedar(s: Sujeito, r: Recurso, c: Contexto,
                               politicas = TEXTO): Decisao {
  const usuario = { type: "Usuario", id: s.id };
  const resposta = cedar.isAuthorized({
    principal: usuario,
    action: { type: "Action", id: "prescrever" },
    resource: { type: "Atendimento", id: r.id },
    context: c,
    policies: { staticPolicies: politicas },
    entities: [
      { uid: usuario, attrs: { suspenso: s.suspenso ?? false },
        parents: [{ type: "Papel", id: s.papel }] },
      { uid: { type: "Atendimento", id: r.id },
        attrs: { autor: { __entity: { type: "Usuario", id: r.autor } }, status: r.status },
        parents: [] },
    ],
  });
  if (resposta.type === "failure")              // erro de política: nega
    return { permitido: false, motivo: "erro na política" };
  const { decision, diagnostics } = resposta.response;
  const quem = diagnostics.reason.map(nome);
  return decision === "allow"
    ? { permitido: true, motivo: quem.join(", ") }
    : { permitido: false, motivo: quem.length ? quem.join(", ") : "nenhuma política permite" };
}
