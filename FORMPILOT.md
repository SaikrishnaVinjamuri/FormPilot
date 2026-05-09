# FormPilot — Project Documentation

## What It Is

Form backend as a service. Developers design their own HTML/React forms, point them at a FormPilot endpoint, and FormPilot handles everything after submit — storage, email notifications, webhook forwarding, spam protection, file validation.

**One line:** "Developers design the form. FormPilot handles the submit."

---

## The Problem

Static/JAMstack sites need working forms. Options today:
- Spin up a backend server — overkill
- Google Forms iframe — breaks your design, ugly, can't style it
- Serverless function per project — repetitive, you rebuild the same thing every time

FormPilot is the missing layer between a custom-designed HTML form and a working backend.

---

## Target Users

Freelance devs, indie hackers, agencies — anyone shipping static sites regularly who wants their own form design without a backend.

---

## Three Personas

| Persona | What They See | What They Do |
|---------|--------------|--------------|
| **Visitor** | A form on someone's website | Fills out, submits, gets redirect |
| **Developer** (customer) | FormPilot dashboard | Signs up, creates endpoints, configures settings, views submissions |
| **Admin** (you) | Full platform view | Monitors all users, queues, errors, metrics |

---

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                    VERCEL                           │
│  ┌─────────────────┐   ┌────────────────────────┐  │
│  │  Next.js App    │   │   Submission API       │  │
│  │  (Dashboard)    │   │   POST /api/f/[id]     │  │
│  └─────────────────┘   └────────────────────────┘  │
└────────────────────────┬────────────────────────────┘
                         │
              ┌──────────▼──────────┐
              │   Upstash Redis     │
              │   (BullMQ queue)    │
              └──────────┬──────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│                    RENDER                           │
│  ┌─────────────────────────────────────────────┐   │
│  │           BullMQ Worker Process             │   │
│  │  ┌──────────┐ ┌──────────┐ ┌────────────┐  │   │
│  │  │  Spam    │ │  Email   │ │  Webhook   │  │   │
│  │  │  Check   │ │  Notify  │ │  Forward   │  │   │
│  │  └──────────┘ └──────────┘ └────────────┘  │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
                         │
              ┌──────────▼──────────┐
              │   Neon PostgreSQL   │
              │   (primary store)   │
              └─────────────────────┘
```

---

## Submission Flow

```
Visitor submits form
        ↓
POST /api/f/[endpointId]
        ↓
Middleware (sync — visitor waits):
  1. CORS check (allowed origin?)
  2. Rate limit check (IP)
  3. Content-length check (size limit)
  4. Parse body (multipart or JSON)
  5. Store submission → Postgres
  6. Enqueue 3 jobs → Redis
  7. Return redirect or JSON  ← visitor done (<200ms)

Background (async — visitor already gone):
  ├── Job 1: Spam check (honeypot + IP rate abuse)
  ├── Job 2: Email notification → Resend → form owner
  ├── Job 3: Webhook delivery → configured URLs
  │          └── On fail: retry x3 exponential backoff
  │                       → dead letter queue
  │                       → email alert to owner
  └── Job 4 (optional): Auto-response email to visitor
```

---

## Database Schema (Tables)

| Table | Purpose |
|-------|---------|
| `users` | FormPilot accounts (developers) |
| `form_endpoints` | One per form — holds all config |
| `submissions` | Raw field data + metadata per submit |
| `delivery_logs` | Every email/webhook attempt + result |
| `api_keys` | Per-user API keys |
| `dead_letter_jobs` | Failed jobs after all retries exhausted |

### Key: `form_endpoints` config fields
- `notification_email` — where to send alerts
- `redirect_url` — where visitor lands after submit
- `allowed_origins` — CORS whitelist
- `webhook_urls` — array of URLs to forward to
- `auto_response_enabled` / `auto_response_template`
- `file_uploads_enabled` / `max_file_size` / `allowed_file_types`
- `spam_protection_enabled`
- `rate_limit_per_minute`

---

## Folder Structure

```
Saas-app/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   ├── page.tsx          # overview + stats
│   │   │   ├── endpoints/        # list + create endpoints
│   │   │   ├── endpoints/[id]/   # submissions + delivery logs
│   │   │   └── settings/         # account, API keys
│   │   └── admin/                # admin-only panel
│   └── api/
│       ├── auth/                 # NextAuth routes
│       ├── f/[endpointId]/       # public submission endpoint
│       ├── endpoints/            # CRUD for form endpoints
│       ├── submissions/          # view/export submissions
│       └── admin/                # admin API routes
├── worker/
│   ├── index.ts                  # worker entry point
│   ├── jobs/
│   │   ├── spam-check.ts
│   │   ├── send-notification.ts
│   │   ├── deliver-webhook.ts
│   │   └── send-autoresponse.ts
│   └── queues.ts                 # BullMQ queue definitions
├── lib/
│   ├── db.ts                     # Prisma client
│   ├── redis.ts                  # Upstash Redis client
│   ├── queues.ts                 # shared queue producers
│   ├── email.ts                  # Resend client
│   ├── auth.ts                   # NextAuth config
│   └── logger.ts                 # Pino config
├── prisma/
│   └── schema.prisma
├── components/
│   └── ui/                       # shadcn components
├── docker-compose.yml            # local dev: Postgres + Redis
├── .env.example
└── .env.local
```

---

## Tech Stack

| Layer | Tool | Why |
|-------|------|-----|
| Framework | Next.js 14 + TypeScript | App Router, API routes, server components |
| UI | Tailwind + shadcn/ui | Fast, clean, accessible |
| Auth | NextAuth.js | Email + Google OAuth, sessions |
| Database | PostgreSQL on Neon | Free, serverless, production-grade |
| ORM | Prisma | Type-safe, migrations |
| Job Queue | BullMQ + Upstash Redis | Async pipeline backbone |
| Email | Resend | Notification + auto-response |
| File Storage | Uploadthing | Form file uploads |
| Logging | Pino | Structured JSON logs with correlation IDs |
| Errors | Sentry | Platform-level monitoring |
| Deploy (app) | Vercel | Free, instant deploys |
| Deploy (worker) | Render | Long-running Node.js process |
| Local dev | Docker Compose | Postgres + Redis locally |

**Monthly cost: $0** on free tiers for dev and demos.

---

## RBAC (Roles)

| Role | Access |
|------|--------|
| `admin` | Full platform — all users, all submissions, queue health, metrics |
| `developer` | Own data only — own endpoints, submissions, delivery logs |

---

## Key Engineering Concepts (Interview Talking Points)

- **Sync/async split** — API responds <200ms, all heavy work in background workers
- **Decoupled worker** — worker crashes don't lose submissions (queued in Redis)
- **Exponential backoff** — webhook retries: 1s → 5s → 30s → DLQ
- **Dead letter queue** — failed jobs stored, visible in dashboard, retryable
- **Correlation IDs** — every request gets a unique ID flowing through API → worker → logs
- **Multi-tenant isolation** — developers can only see their own data
- **Rate limiting** — per-IP on submission endpoint
- **CORS enforcement** — per-endpoint allowed origins
- **Structured logging** — JSON logs queryable by endpoint ID, submission ID, job ID
- **Admin observability** — queue depth, DLQ size, error rates, delivery success %

---

## Build Phases

### Phase 1 — Foundation
- [ ] Scaffold Next.js app
- [ ] Docker Compose (local Postgres + Redis)
- [ ] Prisma schema + migrations
- [ ] NextAuth (email + Google)

### Phase 2 — Core API
- [ ] POST `/api/f/[endpointId]` — submission endpoint
- [ ] CORS middleware
- [ ] Rate limiting
- [ ] File upload handling
- [ ] BullMQ queue setup

### Phase 3 — Worker
- [ ] Worker process entry point
- [ ] Spam check job
- [ ] Email notification job (Resend)
- [ ] Webhook delivery job + retry + DLQ
- [ ] Auto-response job

### Phase 4 — Dashboard
- [ ] Endpoint CRUD (create, edit, delete)
- [ ] Submissions table (auto-columns from field names)
- [ ] Delivery logs view
- [ ] CSV export
- [ ] API key management

### Phase 5 — Admin Panel
- [ ] Platform metrics (users, submissions, volume)
- [ ] Queue health (pending, active, failed jobs)
- [ ] Dead letter queue viewer + retry
- [ ] Error rate trends

### Phase 6 — Polish
- [ ] Sentry integration
- [ ] Health check endpoint
- [ ] README with architecture diagram
- [ ] Deploy to Vercel + Render
- [ ] Live demo
