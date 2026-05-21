import { Hono } from "hono";
import { z } from "zod";
import {
  calendarClient,
  exchangeCode,
  getAuthUrl,
  refreshIfNeeded,
} from "../lib/google.js";
import {
  createSession,
  getGoogleTokens,
  getSession,
  setGoogleTokens,
} from "../lib/sessions.js";

export const googleRoutes = new Hono();

googleRoutes.post("/session", (c) => {
  const session = createSession();
  return c.json({ sessionId: session.id });
});

googleRoutes.get("/auth-url", (c) => {
  const sessionId = c.req.query("sessionId");
  if (!sessionId || !getSession(sessionId)) {
    return c.json({ error: "Invalid session" }, 400);
  }
  const url = getAuthUrl(sessionId);
  return c.json({ url });
});

googleRoutes.get("/callback", async (c) => {
  const code = c.req.query("code");
  const sessionId = c.req.query("state");
  if (!code || !sessionId) {
    return c.text("Missing code or session", 400);
  }
  const tokens = await exchangeCode(code);
  setGoogleTokens(sessionId, tokens);
  return c.html(`
    <html><body style="font-family:system-ui;padding:2rem">
      <h1>Google Calendar connected</h1>
      <p>You can close this window and return to the app.</p>
    </body></html>
  `);
});

googleRoutes.get("/status", (c) => {
  const sessionId = c.req.header("x-session-id");
  if (!sessionId) return c.json({ connected: false });
  const tokens = getGoogleTokens(sessionId);
  return c.json({ connected: !!tokens });
});

async function withCalendar(sessionId: string) {
  let tokens = getGoogleTokens(sessionId);
  if (!tokens) throw new Error("Not connected to Google");
  tokens = await refreshIfNeeded(tokens);
  setGoogleTokens(sessionId, tokens);
  return calendarClient(tokens);
}

googleRoutes.get("/events", async (c) => {
  const sessionId = c.req.header("x-session-id");
  if (!sessionId) return c.json({ error: "Missing session" }, 401);

  const from = c.req.query("from");
  const to = c.req.query("to");
  if (!from || !to) return c.json({ error: "from and to required" }, 400);

  try {
    const cal = await withCalendar(sessionId);
    const res = await cal.events.list({
      calendarId: "primary",
      timeMin: from,
      timeMax: to,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = (res.data.items ?? []).map((e) => ({
      id: e.id ?? "",
      source: "google" as const,
      title: e.summary ?? "Untitled",
      start: e.start?.dateTime ?? e.start?.date ?? "",
      end: e.end?.dateTime ?? e.end?.date ?? "",
      location: e.location ?? undefined,
      description: e.description ?? undefined,
      calendarId: "primary",
    }));

    return c.json({ events });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

const createEventSchema = z.object({
  title: z.string(),
  start: z.string(),
  end: z.string(),
  location: z.string().optional(),
  description: z.string().optional(),
});

googleRoutes.post("/events", async (c) => {
  const sessionId = c.req.header("x-session-id");
  if (!sessionId) return c.json({ error: "Missing session" }, 401);

  const body = createEventSchema.parse(await c.req.json());
  try {
    const cal = await withCalendar(sessionId);
    const res = await cal.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: body.title,
        location: body.location,
        description: body.description,
        start: { dateTime: body.start },
        end: { dateTime: body.end },
      },
    });

    return c.json({
      event: {
        id: res.data.id ?? "",
        source: "google",
        title: body.title,
        start: body.start,
        end: body.end,
        location: body.location,
        description: body.description,
        calendarId: "primary",
      },
    });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

googleRoutes.patch("/events/:id", async (c) => {
  const sessionId = c.req.header("x-session-id");
  if (!sessionId) return c.json({ error: "Missing session" }, 401);

  const body = createEventSchema.partial().parse(await c.req.json());
  try {
    const cal = await withCalendar(sessionId);
    const existing = await cal.events.get({
      calendarId: "primary",
      eventId: c.req.param("id"),
    });

    const res = await cal.events.patch({
      calendarId: "primary",
      eventId: c.req.param("id"),
      requestBody: {
        summary: body.title ?? existing.data.summary,
        location: body.location ?? existing.data.location,
        description: body.description ?? existing.data.description,
        start: body.start
          ? { dateTime: body.start }
          : existing.data.start ?? undefined,
        end: body.end ? { dateTime: body.end } : existing.data.end ?? undefined,
      },
    });

    return c.json({
      event: {
        id: res.data.id ?? "",
        source: "google",
        title: res.data.summary ?? "",
        start: res.data.start?.dateTime ?? "",
        end: res.data.end?.dateTime ?? "",
      },
    });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

googleRoutes.delete("/events/:id", async (c) => {
  const sessionId = c.req.header("x-session-id");
  if (!sessionId) return c.json({ error: "Missing session" }, 401);

  try {
    const cal = await withCalendar(sessionId);
    await cal.events.delete({
      calendarId: "primary",
      eventId: c.req.param("id"),
    });
    return c.json({ ok: true });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

// Mobile token exchange: accept server auth code from Google Sign-In
googleRoutes.post("/link", async (c) => {
  const body = z
    .object({
      sessionId: z.string(),
      code: z.string(),
    })
    .parse(await c.req.json());

  if (!getSession(body.sessionId)) {
    return c.json({ error: "Invalid session" }, 400);
  }

  const tokens = await exchangeCode(body.code);
  setGoogleTokens(body.sessionId, tokens);
  return c.json({ connected: true });
});
