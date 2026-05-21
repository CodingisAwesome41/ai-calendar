import { Hono } from "hono";
import { z } from "zod";
import { completeJson } from "../lib/ai.js";

const parseEventSchema = z.object({
  text: z.string().min(1),
  timezone: z.string().default("America/Los_Angeles"),
  referenceDate: z.string().optional(),
});

const parsedEventSchema = z.object({
  title: z.string(),
  start: z.string(),
  end: z.string(),
  duration: z.number().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

const suggestSlotsSchema = z.object({
  durationMinutes: z.number().min(15).max(480),
  dateFrom: z.string(),
  dateTo: z.string(),
  workingHoursStart: z.string().default("09:00"),
  workingHoursEnd: z.string().default("17:00"),
  timezone: z.string().default("America/Los_Angeles"),
  attendees: z.string().optional(),
  busyBlocks: z.array(
    z.object({
      start: z.string(),
      end: z.string(),
      title: z.string().optional(),
    })
  ),
});

const slotSuggestionSchema = z.object({
  suggestions: z.array(
    z.object({
      start: z.string(),
      end: z.string(),
      score: z.number(),
      reasoning: z.string(),
    })
  ),
});

const summarizeSchema = z.object({
  scope: z.enum(["day", "week"]),
  anchorDate: z.string(),
  timezone: z.string().default("America/Los_Angeles"),
  events: z.array(
    z.object({
      title: z.string(),
      start: z.string(),
      end: z.string(),
      location: z.string().optional(),
      description: z.string().optional(),
      source: z.enum(["local", "google"]).optional(),
    })
  ),
});

export const aiRoutes = new Hono();

aiRoutes.post("/parse-event", async (c) => {
  const body = parseEventSchema.parse(await c.req.json());
  const ref = body.referenceDate ?? new Date().toISOString().split("T")[0];

  const result = await completeJson<z.infer<typeof parsedEventSchema>>(
    `You parse natural language into calendar events. Use timezone ${body.timezone}. Reference date for relative phrases: ${ref}. Return ISO 8601 datetimes with offset.`,
    `Parse this into a calendar event: "${body.text}"`
  );

  const event = parsedEventSchema.parse(result);
  return c.json({ event });
});

aiRoutes.post("/suggest-slots", async (c) => {
  const body = suggestSlotsSchema.parse(await c.req.json());

  const result = await completeJson<z.infer<typeof slotSuggestionSchema>>(
    `You suggest meeting times. Respect working hours ${body.workingHoursStart}-${body.workingHoursEnd} in ${body.timezone}. Avoid busy blocks. Return 3-5 ranked suggestions with score 0-100.`,
    JSON.stringify({
      durationMinutes: body.durationMinutes,
      range: { from: body.dateFrom, to: body.dateTo },
      attendees: body.attendees,
      busyBlocks: body.busyBlocks,
    })
  );

  const data = slotSuggestionSchema.parse(result);
  return c.json(data);
});

aiRoutes.post("/summarize", async (c) => {
  const body = summarizeSchema.parse(await c.req.json());

  const result = await completeJson<{ summary: string; prepNotes: string[] }>(
    `You summarize calendars helpfully. Scope: ${body.scope} around ${body.anchorDate} in ${body.timezone}. Use markdown for summary.`,
    JSON.stringify({ events: body.events }),
    "quality"
  );

  return c.json({
    summary: result.summary,
    prepNotes: result.prepNotes ?? [],
  });
});
