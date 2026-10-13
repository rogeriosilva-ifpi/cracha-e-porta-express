import { subject } from "@casl/ability";
import { describe, expect, it } from "vitest";
import type { Papel } from "../src/compartilhado/dados.js";
import { db } from "../src/compartilhado/dados.js";
import { habilidades, TRADUCAO } from "../src/acesso/habilidades.js";
import { pode, type Permissao } from "../src/acesso/permissoes.js";

const papeis: Papel[] = ["admin", "profissional", "recepcao"];
const permissoes = Object.keys(TRADUCAO) as Permissao[];

describe("CASL e a matriz dizem a mesma coisa", () => {
  it.each(papeis)("%s: todas as permissões", (papel) => {
    const h = habilidades({ id: "x", papel });
    for (const p of permissoes) expect(h.can(...TRADUCAO[p])).toBe(pode(papel, p));
  });
});

describe("condição sobre o objeto", () => {
  const e1 = subject("Atendimento", { ...db.atendimentos[0]! });   // da Ana, aberto
  it("Ana prescreve no próprio atendimento; Bruno não", () => {
    expect(habilidades({ id: "u2", papel: "profissional" }).can("prescrever", e1)).toBe(true);
    expect(habilidades({ id: "u3", papel: "profissional" }).can("prescrever", e1)).toBe(false);
  });
  it("atendimento finalizado: ninguém prescreve", () => {
    const fim = subject("Atendimento", { ...db.atendimentos[0]!, status: "finalizado" });
    expect(habilidades({ id: "u2", papel: "profissional" }).can("prescrever", fim)).toBe(false);
  });
  it("admin gerencia usuários, mas não prescreve", () => {
    const h = habilidades({ id: "u1", papel: "admin" });
    expect(h.can("manage", "Usuario")).toBe(true);
    expect(h.can("prescrever", e1)).toBe(false);
  });
});
