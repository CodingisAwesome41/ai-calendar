# AI Calendar

Cross-platform mobile calendar with Anthropic AI: natural language event creation, smart scheduling, and day/week summaries. Syncs with device calendars (Apple/iCloud on iOS) and Google Calendar.

## Project structure

```
ai-calendar/
  api/       # Hono + Anthropic + Google Calendar API
  mobile/    # Expo React Native app
```

## Prerequisites

- Node.js 20+
- [Anthropic API key](https://console.anthropic.com/)
- Google Cloud project with Calendar API + OAuth clients (Web, iOS, Android)
- Expo Go or EAS dev client for mobile testing
- iOS Simulator or device for calendar permission testing

## Quick start

### 1. Install dependencies

```bash
cd ~/Projects/ai-calendar
npm install --cache /tmp/npm-cache-ai-calendar
```

If you hit npm cache permission errors on macOS:

```bash
sudo chown -R $(whoami) ~/.npm
```

### 2. Configure API

```bash
cp api/.env.example api/.env
# Edit api/.env — set ANTHROPIC_API_KEY and Google OAuth vars
```

### 3. Start API

```bash
npm run api
# http://localhost:3001/health
```

### 4. Configure mobile

```bash
cp mobile/.env.example mobile/.env
# EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:3001  (use LAN IP for physical device)
# Add Google OAuth client IDs
```

### 5. Start mobile

```bash
npm run mobile
```

Press `i` for iOS simulator or scan QR with Expo Go.

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/ai/parse-event` | NL → structured event |
| POST | `/ai/suggest-slots` | Find meeting times |
| POST | `/ai/summarize` | Day/week summary |
| POST | `/google/session` | Create session |
| GET | `/google/auth-url` | OAuth URL |
| GET | `/google/callback` | OAuth callback |
| POST | `/google/link` | Link auth code from mobile |
| GET | `/google/events` | List events (header: `x-session-id`) |
| POST | `/google/events` | Create event |

## Google OAuth setup

1. Enable **Google Calendar API** in Google Cloud Console.
2. Create OAuth clients: **Web** (for API redirect), **iOS**, **Android**.
3. Web redirect URI: `http://localhost:3001/google/callback` (dev) or your deployed API URL.
4. Add client IDs to `api/.env` and `mobile/.env`.

**Connect in app:** Settings → Connect Google (in-app OAuth or browser flow).

## Privacy

- Event metadata is sent to **Anthropic** for AI features.
- **Google** refresh tokens are encrypted on the API server (`TOKEN_ENCRYPTION_KEY`).
- **Apple/iCloud** calendars are accessed on-device only via iOS permissions — no server-side Apple API.

## EAS Build (TestFlight / APK)

```bash
cd mobile
npx eas-cli login
npx eas init   # sets projectId in app.json
npx eas build --profile development --platform ios
npx eas build --profile preview --platform android
```

Use a **development build** for full calendar + notification support (Expo Go has limited native modules).

## Deploy API

Deploy `api/` to Vercel, Railway, or Fly.io. Set env vars and update:

- `GOOGLE_REDIRECT_URI` → `https://your-api.example.com/google/callback`
- `EXPO_PUBLIC_API_URL` in mobile → your API URL

## Troubleshooting

| Issue | Fix |
|-------|-----|
| AI parse fails | Check `ANTHROPIC_API_KEY` in `api/.env` |
| Mobile can't reach API | Use LAN IP, not `localhost`, on physical device |
| No device events | Grant calendar permission in iOS Settings |
| Google not connecting | Verify OAuth client IDs and redirect URI |
