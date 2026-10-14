// Cifra em repouso (capítulo 13): AES-256-GCM com chave fora do banco.
// O texto cifrado leva a versão da chave ("v1:...") para permitir rotação.
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { config } from "./config.js";

export function criarCofre(chaves: Map<string, Buffer>, atual: string) {
  const cifrar = (texto: string): string => {
    const iv = randomBytes(12);                       // nunca repetir com a mesma chave
    const c = createCipheriv("aes-256-gcm", chaves.get(atual)!, iv);
    const corpo = Buffer.concat([c.update(texto, "utf8"), c.final()]);
    return `${atual}:${Buffer.concat([iv, c.getAuthTag(), corpo]).toString("base64")}`;
  };
  const decifrar = (caixa: string): string => {
    const [versao, b64] = caixa.split(":");
    const chave = chaves.get(versao!);
    if (!chave || !b64) throw new Error("versão de chave desconhecida");
    const bruto = Buffer.from(b64, "base64");
    const d = createDecipheriv("aes-256-gcm", chave, bruto.subarray(0, 12));
    d.setAuthTag(bruto.subarray(12, 28));             // alterado? lança erro
    return d.update(bruto.subarray(28), undefined, "utf8") + d.final("utf8");
  };
  /** Rotação: o que foi cifrado com chave antiga é recifrado com a atual. */
  const precisaRecifrar = (caixa: string) => !caixa.startsWith(`${atual}:`);
  return { cifrar, decifrar, precisaRecifrar };
}

const chaves = new Map(Object.entries(config.chavesDados)
  .map(([v, k]) => [v, Buffer.from(k, "base64")]));
if (!chaves.size) chaves.set("dev", randomBytes(32));   // só fora de produção
export const { cifrar, decifrar, precisaRecifrar } = criarCofre(chaves, config.dadosAtual);
