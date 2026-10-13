// Banco SQLite. Por padrão em memória: cada vez que o servidor sobe,
// começa limpo e semeado. Defina DB_PATH para gravar em arquivo.
import Database from "better-sqlite3";

export const banco = new Database(process.env.DB_PATH ?? ":memory:");

banco.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id            TEXT PRIMARY KEY,
    nome          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    papel         TEXT NOT NULL,
    password_hash TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS redefinicoes (
    token_hash TEXT PRIMARY KEY,   -- sha256 do token, nunca o token
    usuario_id TEXT NOT NULL,
    expira_em  INTEGER NOT NULL,   -- epoch em ms
    usado      INTEGER NOT NULL DEFAULT 0
  );
`);
