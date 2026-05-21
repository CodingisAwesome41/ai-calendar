import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { aiRoutes } from "./routes/ai.js";
import { googleRoutes } from "./routes/google.js";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "x-session-id"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  })
);

app.get("/health", (c) => c.json({ ok: true, service: "ai-calendar-api" }));

app.route("/ai", aiRoutes);
app.route("/google", googleRoutes);

const port = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port }, () => {
  console.log(`AI Calendar API running on http://localhost:${port}`);
});
