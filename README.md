# FormPilot

Collect form submissions without writing a backend. Point your HTML form at a FormPilot endpoint and get spam protection, email notifications, webhook forwarding, and a full submission dashboard — out of the box.

## Features

- **Drop-in endpoint** — one URL, works with any HTML form
- **Spam protection** — honeypot fields + heuristic keyword scoring
- **Email notifications** — get notified on every submission
- **Auto-response** — send a customised thank-you email to submitters
- **Webhook delivery** — forward submissions to Slack, Zapier, or any HTTP endpoint with automatic retry and dead-letter queue
- **Submission dashboard** — browse submissions with auto-detected columns from your form fields
- **CORS & rate limiting** — lock endpoints to your domain, cap requests per minute
- **API keys** — programmatic access per user
- **Admin panel** — user management, platform stats, DLQ viewer with retry
- **Dark / light theme**

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | PostgreSQL via Prisma 7 + `@prisma/adapter-pg` |
| Auth | NextAuth v5 (credentials + Google) |
| Background jobs | Trigger.dev v4 |
| Cache / rate-limit | Redis (ioredis) |
| Email | Brevo |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER'S WEBSITE                        │
│   <form action="https://yourapp.com/api/f/{endpointId}">    │
└───────────────────────────┬─────────────────────────────────┘
                            │ POST (JSON / FormData / URLEncoded)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              NEXT.JS APP  /api/f/[endpointId]               │
│                                                              │
│  1. CORS check       allowedOrigins list per endpoint        │
│  2. Rate limit       Redis sliding window, per IP+endpoint   │
│  3. Parse body       JSON / multipart / urlencoded           │
│  4. Honeypot         instant spam flag, configurable field   │
│  5. Persist          Submission row saved to PostgreSQL       │
│  6. Trigger jobs     fired via Trigger.dev (if not spam):    │
│       emailNotificationTask  notify endpoint owner           │
│       webhookDeliveryTask    POST to each webhook URL        │
│       autoResponseTask       reply email to submitter        │
│     Always:                                                  │
│       spamCheckTask          async keyword/link scoring      │
│  7. Respond          JSON {success, id} or 302 redirect      │
└───────────────────────────┬─────────────────────────────────┘
                            │ task.trigger()
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      TRIGGER.DEV CLOUD                       │
│                                                              │
│  spam-check          score fields, mark isSpam in DB        │
│  email-notification  send email via Brevo to owner          │
│  webhook-delivery    POST payload to configured URLs         │
│  auto-response       send reply email to submitter          │
│                                                              │
│  Each job writes DeliveryLog rows:                           │
│  PENDING → DELIVERED / FAILED → RETRYING → DEAD_LETTERED    │
└─────────────────────────────────────────────────────────────┘
```

### Data model

```
User ──< FormEndpoint ──< Submission ──< DeliveryLog
     ──< ApiKey                      ──< DeadLetterJob
     ──< Account (OAuth)
     ──< Session
```

- **FormEndpoint** — per-form config: CORS origins, webhook URLs, rate limit, auto-response template, spam settings
- **Submission** — raw fields (JSON), IP, user agent, spam flag
- **DeliveryLog** — per-delivery audit trail with retry tracking
- **DeadLetterJob** — jobs that exhausted retries, reviewable in admin UI

## Local development

**Prerequisites:** Docker, Node.js 20+

```bash
# 1. Clone and install
git clone https://github.com/SaikrishnaVinjamuri/FormPilot.git
cd FormPilot
npm install

# 2. Copy env file and fill in values
cp .env.example .env

# 3. Start Postgres + Redis
npm run docker:up

# 4. Run migrations and generate Prisma client
npm run db:migrate

# 5. Start the app (terminal 1)
npm run dev

# 6. Start Trigger.dev worker (terminal 2)
npx trigger.dev@latest dev
```

App runs at `http://localhost:3000`.

## Environment variables

See `.env.example` for all required variables.

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `AUTH_SECRET` | NextAuth secret (`openssl rand -base64 32`) |
| `AUTH_URL` | App URL for NextAuth |
| `BREVO_API_KEY` | Brevo API key for email |
| `BREVO_FROM_EMAIL` | Verified sender email on Brevo |
| `BREVO_FROM_NAME` | Sender name shown in emails |
| `TRIGGER_SECRET_KEY` | Trigger.dev project secret key |
| `NEXT_PUBLIC_APP_URL` | Public app URL (used in endpoint URLs) |

## Usage

1. Register an account at `/register`
2. Create an endpoint at `/dashboard/endpoints/new`
3. Copy the endpoint URL
4. Point your form at it:

```html
<form action="https://your-app.vercel.app/api/f/YOUR_ENDPOINT_ID" method="POST">
  <input name="email" type="email" />
  <input name="message" />
  <button type="submit">Send</button>
</form>
```

Or via JSON:

```bash
curl -X POST https://your-app.vercel.app/api/f/YOUR_ENDPOINT_ID \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","message":"Hello!"}'
```



## Project structure

```
src/
├── app/
│   ├── (auth)/          # Login, register pages
│   ├── (dashboard)/     # Dashboard, endpoints, settings, admin
│   └── api/             # API routes
│       └── f/           # Public form submission endpoint
├── components/
│   ├── dashboard/       # Dashboard UI components
│   ├── admin/           # Admin panel components
│   └── settings/        # Settings page components
├── lib/                 # DB, Redis, rate limiting, email, logger
├── trigger/             # Trigger.dev background task definitions
└── auth/                # NextAuth config
prisma/
└── schema.prisma        # Database schema
```
