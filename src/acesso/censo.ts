// Censo de rotas: lista toda rota registrada e a política declarada.
// Lê o roteador do próprio Express; não depende de convenção humana.
import type { Express } from "express";
import { MARCA, type Marcado, type Politica } from "./politica.js";

export interface Linha { metodo: string; caminho: string; politica?: Politica }

// Rotas que podem ser públicas. Acrescentar aqui exige revisão.
export const PUBLICAS = new Set([
  "GET /health",
  "POST /api/auth/login",
  "POST /api/auth/token",
  "POST /api/auth/refresh",
  "POST /api/auth/mfa/verificar",
  "GET /api/auth/oidc/iniciar",
  "GET /api/auth/oidc/callback",
  "GET /.well-known/jwks.json",
  "POST /api/auth/reset/solicitar",
  "POST /api/auth/reset/confirmar",
]);

export function levantar(app: Express): Linha[] {
  type Camada = { route?: { path: string; methods: Record<string, boolean>;
                  stack: { handle: Partial<Marcado> }[] } };
  const pilha = (app.router as unknown as { stack: Camada[] }).stack;
  return pilha.filter((c) => c.route).flatMap(({ route }) =>
    Object.keys(route!.methods).map((m) => ({
      metodo: m.toUpperCase(),
      caminho: route!.path,
      politica: route!.stack[0]?.handle[MARCA],
    })));
}

export function problemas(linhas: Linha[]): string[] {
  return linhas.flatMap(({ metodo, caminho, politica }) => {
    const rota = `${metodo} ${caminho}`;
    if (!politica) return [`${rota}: sem política declarada`];
    if ("publica" in politica && !PUBLICAS.has(rota))
      return [`${rota}: pública sem estar em PUBLICAS`];
    // "Basta estar logado" só vale para a própria conta (cap. 11).
    if ("autenticada" in politica && !caminho.startsWith("/api/auth/"))
      return [`${rota}: só autenticada; declare uma permissão`];
    return [];
  });
}
