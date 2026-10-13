import { describe, expect, it } from "vitest";
import { criarApp } from "../src/app.js";
import { levantar, problemas } from "../src/acesso/censo.js";

describe("censo de rotas", () => {
  it("toda rota declara política; pública só se estiver na lista", () => {
    expect(problemas(levantar(criarApp()))).toEqual([]);
  });
});
