// ⚠ CRACHÁ DE PAPELÃO — andaime do capítulo 3, NÃO É AUTENTICAÇÃO.
// Qualquer cliente escreve o cabeçalho que quiser. Ele existe só para
// ligarmos o pipeline antes de termos senha (cap. 4), sessão (cap. 5)
// e token (cap. 6). O ataque ATQ-01.11 continua vulnerável até lá.
import type { Request } from "express";
import { db, type Usuario } from "../compartilhado/dados.js";

export function identificar(req: Request): Usuario | undefined {
  const email = req.get("X-Usuario-Demo");
  return email ? db.usuarios.find((u) => u.email === email) : undefined;
}
