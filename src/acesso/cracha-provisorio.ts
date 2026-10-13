// ⚠ CRACHÁ DE PAPELÃO — andaime do capítulo 3, NÃO É AUTENTICAÇÃO.
// Qualquer cliente escreve o cabeçalho que quiser. Ele existe só para
// ligarmos o pipeline antes de termos senha (cap. 4), sessão (cap. 5)
// e token (cap. 6). O ataque ATQ-01.11 continua vulnerável até lá.
import type { Request } from "express";
import { usuarios, type Usuario } from "./usuarios.js";

export function identificar(req: Request): Usuario | undefined {
  const email = req.get("X-Usuario-Demo");
  return email ? usuarios.porEmail(email) : undefined;
}
