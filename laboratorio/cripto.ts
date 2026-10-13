// laboratorio/cripto.ts — as ferramentas do capítulo 2, rodando.
// uso: npx tsx laboratorio/cripto.ts
import {
  createHash, createHmac, generateKeyPairSync,
  randomBytes, sign, timingSafeEqual, verify,
} from "node:crypto";

const titulo = (t: string) => console.log(`\n${t}`);
const sha256 = (s: string) =>
  createHash("sha256").update(s).digest("hex");

titulo("1 · ALEATORIEDADE");
console.log("Math.random :", Math.random());
console.log("randomBytes :", randomBytes(24).toString("base64url"));

titulo("2 · HASH SHA-256");
const a = sha256("prescrever"), b = sha256("prescreveR");
console.log("prescrever →", a.slice(0, 24) + "…");
console.log("prescreveR →", b.slice(0, 24) + "…");
console.log("de novo    →", sha256("prescrever").slice(0, 24) + "…");
const n = 200_000, t0 = performance.now();
for (let i = 0; i < n; i++) sha256("senha" + i);
const porSeg = Math.round(n / ((performance.now() - t0) / 1000));
console.log("velocidade :", porSeg.toLocaleString("pt-BR"), "hashes/s");

titulo("3 · HMAC: ASSINATURA COM SEGREDO");
const segredo = randomBytes(32);
const assinar = (m: string) =>
  createHmac("sha256", segredo).update(m).digest("hex");
const msg = "paciente=p1;acao=ler";
const tag = assinar(msg);
console.log("mensagem   :", msg);
console.log("assinatura :", tag.slice(0, 24) + "…");
const confere = (m: string, t: string) =>
  timingSafeEqual(Buffer.from(assinar(m)), Buffer.from(t));
console.log("original confere?   ", confere(msg, tag));
console.log("p1→p2 confere?      ",
  confere("paciente=p2;acao=ler", tag));
const forjada = createHmac("sha256", "chute")
  .update("paciente=p2;acao=ler").digest("hex");
console.log("forjada sem segredo?",
  confere("paciente=p2;acao=ler", forjada));

titulo("4 · ASSINATURA COM PAR DE CHAVES (Ed25519)");
const { privateKey, publicKey } = generateKeyPairSync("ed25519");
const dado = Buffer.from("usuario=ana;papel=profissional");
const ass = sign(null, dado, privateKey);
console.log("assina com a privada; confere com a pública:");
console.log("original confere?", verify(null, dado, publicKey, ass));
const mexido = Buffer.from("usuario=ana;papel=admin");
console.log("papel trocado?   ", verify(null, mexido, publicKey, ass));

titulo("5 · BASE64 NÃO É SEGREDO");
const cod = Buffer.from('{"usuario":"ana","papel":"admin"}')
  .toString("base64url");
console.log("codificado  :", cod);
console.log("decodificado:",
  Buffer.from(cod, "base64url").toString());
