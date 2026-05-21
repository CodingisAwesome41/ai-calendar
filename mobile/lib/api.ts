import { getSessionId } from "./session";
import type { CalendarEvent, ParsedEvent, SlotSuggestion } from "./types";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  withSession = false
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (withSession) {
    headers["x-session-id"] = await getSessionId();
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? `Request failed: ${res.status}`);
  }
  return data as T;
}

export async function parseEvent(
  text: string,
  timezone: string,
  referenceDate?: string
): Promise<ParsedEvent> {
  const res = await apiFetch<{ event: ParsedEvent }>("/ai/parse-event", {
    method: "POST",
    body: JSON.stringify({ text, timezone, referenceDate }),
  });
  return res.event;
}

export async function suggestSlots(params: {
  durationMinutes: number;
  dateFrom: string;
  dateTo: string;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  timezone: string;
  attendees?: string;
  busyBlocks: { start: string; end: string; title?: string }[];
}): Promise<SlotSuggestion[]> {
  const res = await apiFetch<{ suggestions: SlotSuggestion[] }>(
    "/ai/suggest-slots",
    {
      method: "POST",
      body: JSON.stringify(params),
    }
  );
  return res.suggestions;
}

export async function summarizeCalendar(params: {
  scope: "day" | "week";
  anchorDate: string;
  timezone: string;
  events: CalendarEvent[];
}): Promise<{ summary: string; prepNotes: string[] }> {
  return apiFetch("/ai/summarize", {
    method: "POST",
    body: JSON.stringify({
      scope: params.scope,
      anchorDate: params.anchorDate,
      timezone: params.timezone,
      events: params.events.map((e) => ({
        title: e.title,
        start: e.start,
        end: e.end,
        location: e.location,
        description: e.description,
        source: e.source,
      })),
    }),
  });
}

export async function getGoogleStatus(): Promise<boolean> {
  const res = await apiFetch<{ connected: boolean }>(
    "/google/status",
    {},
    true
  );
  return res.connected;
}

export async function getGoogleAuthUrl(): Promise<string> {
  const sessionId = await getSessionId();
  const res = await apiFetch<{ url: string }>(
    `/google/auth-url?sessionId=${sessionId}`
  );
  return res.url;
}

export async function linkGoogleCode(code: string): Promise<void> {
  const sessionId = await getSessionId();
  await apiFetch("/google/link", {
    method: "POST",
    body: JSON.stringify({ sessionId, code }),
  });
}

export async function fetchGoogleEvents(
  from: string,
  to: string
): Promise<CalendarEvent[]> {
  const res = await apiFetch<{ events: CalendarEvent[] }>(
    `/google/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    {},
    true
  );
  return res.events;
}

export async function createGoogleEvent(
  event: Omit<CalendarEvent, "id" | "source">
): Promise<CalendarEvent> {
  const res = await apiFetch<{ event: CalendarEvent }>(
    "/google/events",
    {
      method: "POST",
      body: JSON.stringify(event),
    },
    true
  );
  return res.event;
}

export async function deleteGoogleEvent(id: string): Promise<void> {
  await apiFetch(`/google/events/${id}`, { method: "DELETE" }, true);
}
