import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CalendarEvent } from "./types";

const CACHE_KEY = "ai_calendar_events_cache";

export async function cacheEvents(events: CalendarEvent[]): Promise<void> {
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(events));
}

export async function getCachedEvents(): Promise<CalendarEvent[]> {
  const raw = await AsyncStorage.getItem(CACHE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as CalendarEvent[];
  } catch {
    return [];
  }
}
