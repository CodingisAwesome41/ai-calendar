import * as SecureStore from "expo-secure-store";
import { apiFetch } from "./api";

const SESSION_KEY = "ai_calendar_session_id";

export async function getSessionId(): Promise<string> {
  let id = await SecureStore.getItemAsync(SESSION_KEY);
  if (!id) {
    const res = await apiFetch<{ sessionId: string }>("/google/session", {
      method: "POST",
    });
    id = res.sessionId;
    await SecureStore.setItemAsync(SESSION_KEY, id);
  }
  return id;
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
