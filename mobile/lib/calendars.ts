import * as Calendar from "expo-calendar";
import type { CalendarEvent } from "./types";

export async function ensureCalendarPermission(): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === "granted";
}

export async function getDefaultCalendarId(): Promise<string | null> {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const writable = calendars.find((c) => c.allowsModifications);
  return writable?.id ?? calendars[0]?.id ?? null;
}

function toIso(d: Date | string | undefined): string {
  if (!d) return new Date().toISOString();
  return typeof d === "string" ? d : d.toISOString();
}

export async function fetchLocalEvents(
  from: Date,
  to: Date
): Promise<CalendarEvent[]> {
  const granted = await ensureCalendarPermission();
  if (!granted) return [];

  const events = await Calendar.getEventsAsync(
    (await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT)).map(
      (c) => c.id
    ),
    from,
    to
  );

  return events.map((e) => ({
    id: e.id,
    source: "local" as const,
    title: e.title ?? "Untitled",
    start: toIso(e.startDate),
    end: toIso(e.endDate),
    location: e.location ?? undefined,
    description: e.notes ?? undefined,
    calendarId: e.calendarId,
  }));
}

export async function createLocalEvent(event: {
  title: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
  calendarId?: string;
}): Promise<CalendarEvent> {
  const calendarId =
    event.calendarId ?? (await getDefaultCalendarId());
  if (!calendarId) throw new Error("No writable calendar found");

  const id = await Calendar.createEventAsync(calendarId, {
    title: event.title,
    startDate: new Date(event.start),
    endDate: new Date(event.end),
    location: event.location,
    notes: event.description,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  return {
    id,
    source: "local",
    title: event.title,
    start: event.start,
    end: event.end,
    location: event.location,
    description: event.description,
    calendarId,
  };
}

export async function updateLocalEvent(
  id: string,
  patch: Partial<{
    title: string;
    start: string;
    end: string;
    location: string;
    description: string;
  }>
): Promise<void> {
  await Calendar.updateEventAsync(id, {
    title: patch.title,
    startDate: patch.start ? new Date(patch.start) : undefined,
    endDate: patch.end ? new Date(patch.end) : undefined,
    location: patch.location,
    notes: patch.description,
  });
}

export async function deleteLocalEvent(id: string): Promise<void> {
  await Calendar.deleteEventAsync(id);
}
