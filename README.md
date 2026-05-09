# FormPilot

Collect form submissions without writing a backend. Point your HTML form at a FormPilot endpoint and get spam protection, email notifications, webhook forwarding, and a full submission dashboard — out of the box.

## Features

- **Drop-in endpoint** — one URL, works with any HTML form
- **Spam protection** — honeypot fields + heuristic scoring
- **Email notifications** — get notified on every submission (Brevo)
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
| Queue | BullMQ + Redis |
| Email | Brevo |
| Worker | Separate Node.js process (`tsx`) |

## Local development

**Prerequisites:** Docker, Node.js 20+

```bash
# 1. Clone and install
git clone https://github.com/SaikrishnaVinjamuri/FormPilot.git
cd FormPilot
npm install

# 2. Copy env file and fill in values
cp .env.example .env.local

# 3. Start Postgres + Redis
npm run docker:up

# 4. Run migrations and generate Prisma client
npm run db:migrate

# 5. Start the app (terminal 1)
npm run dev

# 6. Start the worker (terminal 2)
npm run worker:dev
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

## Deployment

**App → Vercel**
- Import repo, add env vars, deploy
- Build command: `prisma generate && next build` (set automatically)

**Worker → Render**
- New service → Blueprint → connects via `render.yaml`
- Add `DATABASE_URL`, `REDIS_URL`, `BREVO_*` env vars

**Database → Neon** · **Redis → Upstash**

Run migrations against production DB once:
```bash
DATABASE_URL="your-production-url" npm run db:deploy
```

## Project structure

```
src/
├── app/
│   ├── (auth)/          # Login, register pages
│   ├── (dashboard)/     # Dashboard, endpoints, settings, admin
│   └── api/             # API routes
├── components/
│   ├── dashboard/       # Dashboard UI components
│   ├── admin/           # Admin panel components
│   └── settings/        # Settings page components
├── lib/                 # DB, Redis, queues, email, rate limiting
└── auth/                # NextAuth config
worker/
├── index.ts             # Worker entry point
├── lib/                 # Re-exports from src/lib
└── processors/          # Job processors (spam, email, webhook, auto-response)
prisma/
└── schema.prisma        # Database schema
```
