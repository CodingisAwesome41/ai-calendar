import { fetchGoogleEvents } from "./api";
import { fetchLocalEvents } from "./calendars";
import { cacheEvents, getCachedEvents } from "./storage";
import type { CalendarEvent } from "./types";

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase();
}

export function mergeEvents(
  local: CalendarEvent[],
  google: CalendarEvent[]
): CalendarEvent[] {
  const merged = [...local, ...google];
  const seen = new Set<string>();
  const deduped: CalendarEvent[] = [];

  for (const event of merged.sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  )) {
    const key = `${normalizeTitle(event.title)}|${event.start.slice(0, 16)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(event);
  }

  return deduped;
}

export async function loadAllEvents(
  from: Date,
  to: Date,
  googleConnected: boolean
): Promise<CalendarEvent[]> {
  try {
    const local = await fetchLocalEvents(from, to);
    let google: CalendarEvent[] = [];
    if (googleConnected) {
      try {
        google = await fetchGoogleEvents(from.toISOString(), to.toISOString());
      } catch {
        google = [];
      }
    }
    const merged = mergeEvents(local, google);
    await cacheEvents(merged);
    return merged;
  } catch {
    return getCachedEvents();
  }
}

export function eventsForDay(
  events: CalendarEvent[],
  day: string
): CalendarEvent[] {
  return events.filter((e) => e.start.startsWith(day));
}

export function toMarkedDates(events: CalendarEvent[]): Record<string, { marked: boolean; dots?: { color: string }[] }> {
  const marks: Record<string, { marked: boolean; dots: { color: string }[] }> = {};
  for (const e of events) {
    const day = e.start.slice(0, 10);
    if (!marks[day]) {
      marks[day] = {
        marked: true,
        dots: [{ color: e.source === "google" ? "#4285F4" : "#34C759" }],
      };
    }
  }
  return marks;
}

export function busyBlocks(events: CalendarEvent[]) {
  return events.map((e) => ({
    start: e.start,
    end: e.end,
    title: e.title,
  }));
}
