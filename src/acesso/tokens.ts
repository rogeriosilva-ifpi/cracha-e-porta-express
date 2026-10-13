// Tokens de acesso para clientes de API (capítulo 6).
// Assinados com chave privada Ed25519; quem confere usa só a pública.
import {
  SignJWT, exportJWK, generateKeyPair, jwtVerify, type JWTPayload,
} from "jose";
import { randomBytes, randomUUID } from "node:crypto";

export const EMISSOR = "https://prontuario.exemplo";
export const AUDIENCIA = "prontuario-api";
export const ACCESS_S = 10 * 60;               // 10 minutos
const ALG = "EdDSA";                           // Ed25519
const TIPO = "at+jwt";                         // RFC 9068: token de acesso

type Chave = { kid: string; privada: CryptoKey; publica: CryptoKey };
const chaves: Chave[] = [];                    // [0] assina; todas conferem

/** Gera uma chave nova para assinar; a anterior só confere. */
export async function novaChave() {
  const { privateKey, publicKey } =
    await generateKeyPair(ALG, { crv: "Ed25519" });
  chaves.unshift({ kid: randomBytes(4).toString("hex"),
                   privada: privateKey, publica: publicKey });
  chaves.splice(2);                            // guarda no máximo duas
}
await novaChave();

/** Fábrica de emissores: um por audiência e duração. */
export const emissor = (audiencia: string, duracaoS: number) =>
  (usuarioId: string, extra: JWTPayload = {}) =>
    new SignJWT(extra)
      .setProtectedHeader({ alg: ALG, kid: chaves[0]!.kid, typ: TIPO })
      .setIssuer(EMISSOR)
      .setAudience(audiencia)
      .setSubject(usuarioId)
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) + duracaoS)
      .setJti(randomUUID())
      .sign(chaves[0]!.privada);

export const emitirAccess = emissor(AUDIENCIA, ACCESS_S);

/** Confere tudo; qualquer falha lança erro (quem chama decide: 401). */
export async function verificarAccess(token: string) {
  const { payload } = await jwtVerify(token, ({ kid }) => {
    const c = chaves.find((k) => k.kid === kid);
    if (!c) throw new Error("kid desconhecido");
    return c.publica;
  }, {
    algorithms: [ALG],                         // nunca o que o token pedir
    issuer: EMISSOR,
    audience: AUDIENCIA,
    typ: TIPO,
    requiredClaims: ["exp", "iat", "sub", "jti"],
    clockTolerance: 30,                        // relógios diferem um pouco
  });
  return payload;
}

/** Chaves públicas no formato JWKS, para quem precisa conferir. */
export async function jwks() {
  return { keys: await Promise.all(chaves.map(async (c) => ({
    ...(await exportJWK(c.publica)), kid: c.kid, alg: ALG, use: "sig",
  }))) };
}
