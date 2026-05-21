export type CalendarEvent = {
  id: string;
  source: "local" | "google";
  title: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
  calendarId?: string;
};

export type ParsedEvent = {
  title: string;
  start: string;
  end: string;
  duration?: number;
  location?: string;
  notes?: string;
};

export type SlotSuggestion = {
  start: string;
  end: string;
  score: number;
  reasoning: string;
};
