import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { abac, dePlantao, rbac } from "../src/acesso/decisao.js";
import { autorizarCedar } from "../src/acesso/cedar.js";

type Caso = { caso: string; sujeito: any; recurso: any; contexto: any; esperado: string };
const casos: Caso[] = JSON.parse(readFileSync("politicas/casos.json", "utf8"));
const veredito = (d: { permitido: boolean }) => (d.permitido ? "permitido" : "negado");

describe("tabela de casos (politicas/casos.json)", () => {
  it.each(casos)("ABAC · $caso", (c) => {
    expect(veredito(abac(c.sujeito, c.recurso, c.contexto))).toBe(c.esperado);
  });
  it.each(casos)("Cedar · $caso", (c) => {
    expect(veredito(autorizarCedar(c.sujeito, c.recurso, c.contexto))).toBe(c.esperado);
  });
  it("RBAC puro erra pelo menos um caso (por isso não basta)", () => {
    expect(casos.some((c) => veredito(rbac(c.sujeito, c.recurso, c.contexto)) !== c.esperado)).toBe(true);
  });
});

describe("explicar por que negou", () => {
  const [ok, bruno, , , suspensa] = casos;
  it("Cedar diz qual política decidiu", () => {
    expect(autorizarCedar(ok!.sujeito, ok!.recurso, ok!.contexto).motivo).toBe("prescrever-no-proprio-atendimento");
    expect(autorizarCedar(suspensa!.sujeito, suspensa!.recurso, suspensa!.contexto).motivo).toBe("registro-suspenso");
    expect(autorizarCedar(bruno!.sujeito, bruno!.recurso, bruno!.contexto).motivo).toBe("nenhuma política permite");
  });
  it("ABAC diz qual atributo falhou", () => {
    expect(abac(bruno!.sujeito, bruno!.recurso, bruno!.contexto).motivo).toBe("não é o autor do atendimento");
  });
  it("política com erro de sintaxe nega (falha fechada)", () => {
    const d = autorizarCedar(ok!.sujeito, ok!.recurso, ok!.contexto, "permit (principal, action, resource");
    expect(d).toEqual({ permitido: false, motivo: "erro na política" });
  });
});

describe("atributo do ambiente: plantão", () => {
  const as = (h: number, m = 0) => new Date(2026, 9, 13, h, m);
  it("diurno: Ana às 10h sim, às 19h não", () => {
    expect(dePlantao("u2", as(10))).toBe(true);
    expect(dePlantao("u2", as(19))).toBe(false);
  });
  it("noturno vira a meia-noite: Bruno às 23h e às 3h sim, ao meio-dia não", () => {
    expect(dePlantao("u3", as(23))).toBe(true);
    expect(dePlantao("u3", as(3))).toBe(true);
    expect(dePlantao("u3", as(12))).toBe(false);
  });
  it("sem escala, nunca de plantão", () => {
    expect(dePlantao("u4", as(10))).toBe(false);
  });
});
