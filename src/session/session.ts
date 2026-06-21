import { Database } from "bun:sqlite";
import { existsSync, mkdirSync } from "node:fs";
import type { Message } from "../types/message";

const DB_DIR = ".coil";
if (!existsSync(DB_DIR)) mkdirSync(DB_DIR, { recursive: true });

const db = new Database(`${DB_DIR}/coil.db`);
db.run("PRAGMA foreign_keys = ON");

// tabular session details
db.run(`
  CREATE TABLE IF NOT EXISTS sessions (
    id         TEXT PRIMARY KEY,
    title      TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`);

// one row per message, ordered by seq, full message kept as JSON in data
db.run(`
  CREATE TABLE IF NOT EXISTS messages (
    session_id TEXT NOT NULL,
    seq        INTEGER NOT NULL,
    role       TEXT NOT NULL,
    data       TEXT NOT NULL,
    PRIMARY KEY (session_id, seq),
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
  )
`);

export type Session = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
};

export type SessionMeta = Pick<Session, "id" | "title" | "updatedAt">;

const upsertSession = db.query(`
  INSERT INTO sessions (id, title, created_at, updated_at)
  VALUES ($id, $title, $created_at, $updated_at)
  ON CONFLICT(id) DO UPDATE SET title = $title, updated_at = $updated_at
`);
const clearMessages = db.query(`DELETE FROM messages WHERE session_id = $id`);
const insertMessage = db.query(`
  INSERT INTO messages (session_id, seq, role, data)
  VALUES ($session_id, $seq, $role, $data)
`);
const selectSession = db.query(`SELECT * FROM sessions WHERE id = $id`);
const selectMessages = db.query(
  `SELECT data FROM messages WHERE session_id = $id ORDER BY seq ASC`,
);
const selectAll = db.query(
  `SELECT id, title, updated_at FROM sessions ORDER BY updated_at DESC`,
);
const removeSession = db.query(`DELETE FROM sessions WHERE id = $id`);

// A new chat starts in memory with just the system prompt; not saved yet.
export function createSession(systemPrompt: string): Session {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID().slice(0, 8),
    title: "untitled",
    createdAt: now,
    updatedAt: now,
    messages: [{ role: "system", content: systemPrompt }],
  };
}

const persist = db.transaction((session: Session) => {
  upsertSession.run({
    $id: session.id,
    $title: session.title,
    $created_at: session.createdAt,
    $updated_at: session.updatedAt,
  });
  clearMessages.run({ $id: session.id });
  session.messages.forEach((m, i) => {
    insertMessage.run({
      $session_id: session.id,
      $seq: i,
      $role: m.role,
      $data: JSON.stringify(m),
    });
  });
});

export function saveSession(session: Session): void {
  session.updatedAt = new Date().toISOString();
  if (session.title === "untitled") {
    const firstUser = session.messages.find((m) => m.role === "user");
    if (firstUser?.content) session.title = firstUser.content.slice(0, 50);
  }
  persist(session);
}

export function loadSession(id: string): Session | null {
  const row = selectSession.get({ $id: id }) as
    | { id: string; title: string; created_at: string; updated_at: string }
    | null;
  if (!row) return null;
  const messages = (selectMessages.all({ $id: id }) as { data: string }[]).map(
    (r) => JSON.parse(r.data) as Message,
  );
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    messages,
  };
}

export function listSessions(): SessionMeta[] {
  return (
    selectAll.all() as { id: string; title: string; updated_at: string }[]
  ).map((r) => ({ id: r.id, title: r.title, updatedAt: r.updated_at }));
}

export function deleteSession(id: string): void {
  removeSession.run({ $id: id });
}
