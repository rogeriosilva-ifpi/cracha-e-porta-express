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
`);
