// Hierarquia de erros HTTP: cada erro sabe seu status.
export class HttpError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}
export class BadRequestError extends HttpError { constructor(m = "Requisição inválida.") { super(400, m); } }
export class UnauthorizedError extends HttpError { constructor(m = "Não autenticado.") { super(401, m); } }
export class ForbiddenError extends HttpError { constructor(m = "Acesso negado.") { super(403, m); } }
export class NotFoundError extends HttpError { constructor(m = "Recurso não encontrado.") { super(404, m); } }
export class TooManyRequestsError extends HttpError {
  constructor(readonly retryAfterS: number, m = "Muitas tentativas. Tente mais tarde.") { super(429, m); }
}
