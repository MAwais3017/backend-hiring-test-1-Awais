# Call Forwarding Demo – Backend Hiring Test

I rebuilt the classic “press 1 to forward, press 2 to leave a voicemail” flow using Fastify + TypeScript and Twilio’s Programmable Voice webhooks. The backend returns TwiML responses, stores the call history in a lightweight datastore, and exposes everything through a documented REST API.

> 🎥 Loom walkthrough: https://www.loom.com/share/3f113e289d45466687b435a7e2aa1f85 

## What happens when someone calls?

1. The caller dials the Twilio number you configure for this project.  
2. They hear a short IVR menu:
   - Press **1** → the call is forwarded to whatever number you put in `TWILIO_FORWARD_TO_NUMBER`.  
   - Press **2** → Twilio records a voicemail and sends me the recording URL.  
3. Every call (including forwarding attempt outcomes and voicemail metadata) is logged to `data/calls.db` so we can build an activity feed later.

All inbound webhook requests and API responses are described in Swagger (`/docs`), so you can try things out from the browser.

## Stack

- Fastify 5 + TypeScript
- Twilio Programmable Voice (TwiML webhooks)
- `nedb-promises` (embedded datastore for call logs)
- `@fastify/swagger` / `@fastify/swagger-ui` for OpenAPI docs

## Getting started

```bash
npm install
cp .env.example .env
```

Fill in the new `.env` file:

| Variable | What to drop in |
| --- | --- |
| `PORT` | Local server port (defaults to `3000`) |
| `TWILIO_FORWARD_TO_NUMBER` | The real phone that should receive forwarded calls (E.164) |
| `TWILIO_NUMBER` | Your purchased Twilio number (used as caller ID when we forward) |
| `PUBLIC_BASE_URL` | The external URL Twilio hits (ngrok tunnel works great while developing) |

### Local development

1. Run `npm run dev` – this uses `tsx` to watch and reload.  
2. Start `ngrok http 3000` (or similar) so Twilio can reach your machine.  
3. Update the number in the Twilio console: **Voice & Fax → A CALL COMES IN** → `https://<ngrok-host>/twilio/voice` (POST).  
4. Call your Twilio number, test option 1 and option 2, then check `/calls` for the logged entry.

### Production build

```bash
npm run build
npm start
```

TypeScript outputs to `dist/` and the plain Node runtime serves the same Fastify instance.

## API surface

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/health` | Simple health probe |
| `POST` | `/twilio/voice` | Entry point Twilio hits for new inbound calls |
| `POST` | `/twilio/voice/handle` | Called by Twilio after the IVR `Gather` completes |
| `POST` | `/twilio/voice/dial-action` | Twilio callback with the result of the forwarding attempt |
| `POST` | `/twilio/voice/voicemail` | Voicemail recording metadata |
| `GET` | `/calls` | Activity feed (latest calls, durations, recording links, etc.) |

Swagger UI (with request/response examples) lives at [`http://localhost:3000/docs`](http://localhost:3000/docs). Replace `localhost` with your tunnel host when testing with Twilio.

## Data notes

- Call logs are stored in `data/calls.db` using NeDB’s file-backed datastore.  
- Each record keeps the SID, caller / callee numbers, digits pressed, forwarding status, durations, and voicemail recording metadata (URL + length).  
- This keeps the assessment lightweight, but for a real system I’d swap to PostgreSQL/MySQL so we can query and aggregate more efficiently.

## Manual test plan

1. `npm run build` – type check + compile.  
2. `npm run dev` – start Fastify locally.  
3. Fire up an ngrok tunnel and refresh Twilio’s webhook.  
4. Call the Twilio number:  
   - Press **1** and confirm the forward target rings.  
   - Press **2**, leave a quick voicemail, note the recording URL in `/calls`.  
5. Review `/calls` (or `GET /calls` via Swagger) to confirm the entries look right.

## TODOs / next steps if I kept working

- Replace NeDB with a proper relational store (and add migrations).  
- Wire up automated tests (`vitest`/`supertest`) for both the webhook flow and the `/calls` endpoint.  
- Sign Twilio requests (`X-Twilio-Signature`) before trusting the payload in production.  
- Deploy to a small container or serverless environment, keeping the ngrok tunnel only for local iteration.

That’s it! If you have any trouble running the project, ping me and I’ll walk you through it.
