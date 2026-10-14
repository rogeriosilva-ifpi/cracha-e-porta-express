import { generateKeyPairSync, randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { carregarConfig } from "../src/compartilhado/config.js";
import { criarCofre } from "../src/compartilhado/cofre.js";
import { banco } from "../src/compartilhado/banco.js";
import { chaveDoPem } from "../src/acesso/tokens.js";
import { TOTP_DE_LABORATORIO } from "../src/acesso/usuarios.js";

const pem = () => generateKeyPairSync("ed25519").privateKey
  .export({ type: "pkcs8", format: "pem" }).toString();
const chave32 = () => randomBytes(32).toString("base64");

describe("configuração: falha cedo em produção", () => {
  it("sem segredos, não sobe, e diz o que falta", () => {
    expect(() => carregarConfig({ NODE_ENV: "production" })).toThrow(
      "Configuração inválida para produção: CORS_ORIGINS ausente; CHAVE_JWT_ATUAL ausente; CHAVE_DADOS ausente");
  });
  it("com o valor de exemplo do .env.exemplo, não sobe", () => {
    expect(() => carregarConfig({ NODE_ENV: "production", CORS_ORIGINS: "https://x.exemplo",
      CHAVE_JWT_ATUAL: "troque-por-uma-chave", CHAVE_DADOS: "v1:troque" }))
      .toThrow(/com valor de exemplo/);
  });
  it("completa, sobe; a chave anterior entra só para conferir", () => {
    const c = carregarConfig({ NODE_ENV: "production", CORS_ORIGINS: "https://prontuario.hospital",
      CHAVE_JWT_ATUAL: pem(), CHAVE_JWT_ANTERIOR: pem(), CHAVE_DADOS: `v2:${chave32()}`,
      CHAVE_DADOS_ANTERIOR: `v1:${chave32()}` });
    expect(c.chavesJwt).toHaveLength(2);
    expect(Object.keys(c.chavesDados).sort()).toEqual(["v1", "v2"]);
    expect(c.dadosAtual).toBe("v2");
  });
  it("em desenvolvimento, sobe sem nada (chaves efêmeras)", () => {
    expect(carregarConfig({}).producao).toBe(false);
  });
});

describe("cifra em repouso", () => {
  const v1 = randomBytes(32), v2 = randomBytes(32);
  const antigo = criarCofre(new Map([["v1", v1]]), "v1");
  const novo = criarCofre(new Map([["v1", v1], ["v2", v2]]), "v2");
  it("ida e volta; o texto cifrado não revela o original", () => {
    const c = novo.cifrar("JBSWY3DPEHPK3PXP");
    expect(c).toMatch(/^v2:/);
    expect(c).not.toContain("JBSWY3DPEHPK3PXP");
    expect(novo.decifrar(c)).toBe("JBSWY3DPEHPK3PXP");
  });
  it("um byte alterado: erro, nunca um valor errado", () => {
    const c = Buffer.from(novo.cifrar("segredo totp").slice(3), "base64");
    c[c.length - 1]! ^= 1;
    expect(() => novo.decifrar(`v2:${c.toString("base64")}`)).toThrow();
  });
  it("rotação: o que a v1 cifrou, a v2 ainda lê, e marca para recifrar", () => {
    const velho = antigo.cifrar("segredo da Eva");
    expect(novo.decifrar(velho)).toBe("segredo da Eva");
    expect(novo.precisaRecifrar(velho)).toBe(true);
  });
  it("o banco guarda o segredo TOTP da Eva cifrado", () => {
    const { segredo } = banco.prepare("SELECT segredo FROM mfa WHERE usuario_id = 'u5'").get() as { segredo: string };
    expect(segredo).not.toContain(TOTP_DE_LABORATORIO);
    expect(segredo).toMatch(/^dev:/);
  });
});

describe("chave do JWT vinda do ambiente", () => {
  it("kid é a impressão digital da chave: estável e diferente por chave", async () => {
    const p = pem();
    expect((await chaveDoPem(p)).kid).toBe((await chaveDoPem(p)).kid);
    expect((await chaveDoPem(p)).kid).not.toBe((await chaveDoPem(pem())).kid);
  });
});
