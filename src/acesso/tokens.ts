// Tokens de acesso para clientes de API. VERSÃO INGÊNUA (tag cap06-antes).
import { SignJWT, decodeJwt, jwtVerify } from "jose";
import type { Usuario } from "./usuarios.js";

const SEGREDO = new TextEncoder().encode(process.env.JWT_SECRET ?? "segredo");

export async function emitirAccess(u: Usuario) {
  return new SignJWT({ email: u.email, nome: u.nome, papel: u.papel })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(u.id)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SEGREDO);
}

export async function verificarAccess(token: string) {
  try {
    return (await jwtVerify(token, SEGREDO)).payload;
  } catch {
    // "não derrubar o usuário quando o token vence"
    return decodeJwt(token);
  }
}
