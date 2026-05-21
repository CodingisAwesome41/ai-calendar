import { mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { encrypt, decrypt } from "./crypto.js";

export type GoogleTokens = {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
};

export type Session = {
  id: string;
  googleTokens?: GoogleTokens;
  createdAt: string;
};

const DATA_DIR = join(process.cwd(), "data");
const SESSIONS_FILE = join(DATA_DIR, "sessions.json");

type Store = Record<string, { session: Session; encryptedGoogle?: string }>;

function loadStore(): Store {
  if (!existsSync(SESSIONS_FILE)) return {};
  return JSON.parse(readFileSync(SESSIONS_FILE, "utf8")) as Store;
}

function saveStore(store: Store): void {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(SESSIONS_FILE, JSON.stringify(store, null, 2));
}

export function createSession(): Session {
  const session: Session = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const store = loadStore();
  store[session.id] = { session };
  saveStore(store);
  return session;
}

export function getSession(id: string): Session | null {
  const entry = loadStore()[id];
  return entry?.session ?? null;
}

export function setGoogleTokens(sessionId: string, tokens: GoogleTokens): void {
  const store = loadStore();
  const entry = store[sessionId];
  if (!entry) return;
  entry.encryptedGoogle = encrypt(JSON.stringify(tokens));
  entry.session.googleTokens = tokens;
  saveStore(store);
}

export function getGoogleTokens(sessionId: string): GoogleTokens | null {
  const store = loadStore();
  const entry = store[sessionId];
  if (!entry?.encryptedGoogle) return entry?.session.googleTokens ?? null;
  try {
    return JSON.parse(decrypt(entry.encryptedGoogle)) as GoogleTokens;
  } catch {
    return null;
  }
}
