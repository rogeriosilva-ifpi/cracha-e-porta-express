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
  CREATE TABLE IF NOT EXISTS sessoes (
    id_hash    TEXT PRIMARY KEY,   -- sha256 do token do cookie
    usuario_id TEXT NOT NULL,
    criada_em  INTEGER NOT NULL,
    ultimo_uso INTEGER NOT NULL,
    expira_em  INTEGER NOT NULL    -- limite absoluto
  );
  CREATE TABLE IF NOT EXISTS familias (
    id         TEXT PRIMARY KEY,   -- um login de app = uma família
    usuario_id TEXT NOT NULL,
    criada_em  INTEGER NOT NULL,
    expira_em  INTEGER NOT NULL,   -- limite absoluto da família
    revogada   INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS refresh_tokens (
    token_hash TEXT PRIMARY KEY,   -- sha256 do refresh, nunca o token
    familia    TEXT NOT NULL,
    expira_em  INTEGER NOT NULL,
    usado      INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS mfa (
    usuario_id   TEXT PRIMARY KEY,
    segredo      TEXT NOT NULL,      -- base32 (cap. 13: cifrar em repouso)
    ativo        INTEGER NOT NULL DEFAULT 0,
    ultimo_passo INTEGER NOT NULL DEFAULT 0  -- código não vale duas vezes
  );
  CREATE TABLE IF NOT EXISTS codigos_recuperacao (
    hash       TEXT PRIMARY KEY,     -- sha256 do código
    usuario_id TEXT NOT NULL,
    usado      INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS desafios_mfa (
    hash       TEXT PRIMARY KEY,     -- sha256 do desafio
    usuario_id TEXT NOT NULL,
    canal      TEXT NOT NULL,        -- "cookie" ou "token"
    expira_em  INTEGER NOT NULL,
    tentativas INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS oidc_pedidos (
    state_hash  TEXT PRIMARY KEY,
    nonce       TEXT NOT NULL,
    verificador TEXT NOT NULL,       -- PKCE code_verifier
    expira_em   INTEGER NOT NULL,
    usado       INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS identidades_externas (
    emissor    TEXT NOT NULL,
    sub        TEXT NOT NULL,
    usuario_id TEXT NOT NULL,
    PRIMARY KEY (emissor, sub)
  );
`);
