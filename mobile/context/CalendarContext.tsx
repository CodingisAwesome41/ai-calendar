import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getGoogleStatus } from "@/lib/api";
import { loadAllEvents } from "@/lib/events";
import type { CalendarEvent } from "@/lib/types";
import { format, startOfMonth, endOfMonth, addMonths } from "date-fns";

type CalendarContextValue = {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  events: CalendarEvent[];
  loading: boolean;
  googleConnected: boolean;
  refresh: () => Promise<void>;
  setGoogleConnected: (v: boolean) => void;
};

const CalendarContext = createContext<CalendarContextValue | null>(null);

export function CalendarProvider({ children }: { children: React.ReactNode }) {
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [googleConnected, setGoogleConnected] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const connected = await getGoogleStatus();
      setGoogleConnected(connected);
      const anchor = new Date(selectedDate);
      const from = startOfMonth(addMonths(anchor, -1));
      const to = endOfMonth(addMonths(anchor, 1));
      const merged = await loadAllEvents(from, to, connected);
      setEvents(merged);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      selectedDate,
      setSelectedDate,
      events,
      loading,
      googleConnected,
      refresh,
      setGoogleConnected,
    }),
    [selectedDate, events, loading, googleConnected, refresh]
  );

  return (
    <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>
  );
}

export function useCalendar() {
  const ctx = useContext(CalendarContext);
  if (!ctx) throw new Error("useCalendar must be used within CalendarProvider");
  return ctx;
}
