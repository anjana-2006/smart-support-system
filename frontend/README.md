# SmartSupport — AI-Powered Customer Request Routing System

A mini AI-powered customer request routing system built for the Cognifyr internship assessment.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite, React Router, Socket.io client, Axios |
| Backend | Node.js, Express, Socket.io server |
| Database | PostgreSQL + Prisma ORM |
| Queue | BullMQ + Redis |
| Auth | JWT + bcryptjs |
| AI Layer | Mock provider (OpenAI-compatible interface) |

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL running locally or via Supabase/Railway
- Redis running locally or via Upstash

### 1. Clone and install

```bash
git clone <repo>
cd smart-support-system

# Install backend deps
cd backend
npm install

# Install frontend deps
cd ../frontend
npm install
```

### 2. Configure environment

```bash
cd backend
cp .env.example .env
# Fill in DATABASE_URL, JWT_SECRET, REDIS_HOST etc.
```

### 3. Set up database

```bash
cd backend
npx prisma migrate dev --name init
npm run db:seed
```

### 4. Start services

```bash
# Terminal 1 - Backend API
cd backend && npm run dev

# Terminal 2 - Background worker
cd backend && npm run worker

# Terminal 3 - Frontend
cd frontend && npm run dev
```

### 5. Open app

Visit `http://localhost:5173`

Login: `admin@smartsupport.com` / `admin123`

---

## Architecture

```
[React Frontend] ←→ [Express API + Socket.io]
                          ↓              ↑ realtime
                    [PostgreSQL]    [BullMQ Queue]
                    [Prisma ORM]         ↓
                               [Classification Worker]
                                         ↓
                               [AI Layer: Mock/OpenAI]
```

### Request Lifecycle

1. Customer submits message via API or webhook
2. Request saved immediately with status `QUEUED` — API responds fast
3. Job enqueued in BullMQ + Redis
4. Worker picks job, calls AI classifier
5. AI returns `{category, priority, summary, confidence, reason}`
6. Result stored in `ai_classifications`, request status → `CLASSIFIED`
7. Socket.io emits `request:classified` to admin dashboard
8. Admin reviews, updates status, adds internal notes

---

## Schema Design

### Why AI output is stored separately

`ai_classifications` is a separate table from `customer_requests` by design:
- Keeps the original message immutable (audit trail)
- Supports retry logic (re-run classification without touching original)
- Allows multiple classification attempts tracked with `retryCount`
- Different concerns: business data vs AI output

### Indexes

- `customer_requests`: `status`, `categorySnapshot`, `prioritySnapshot`, `createdAt`
- `ai_classifications`: `requestId`
- `request_events`: `requestId`
- `internal_notes`: `requestId`

---

## API Documentation

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/auth/register` | Create user |

### Requests
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/requests` | Create request, enqueues AI |
| GET | `/api/requests` | List with filters: `status`, `priority`, `category`, `page`, `limit` |
| GET | `/api/requests/:id` | Full detail: message, AI, notes, events |
| PATCH | `/api/requests/:id/status` | Update status |
| POST | `/api/requests/:id/notes` | Add internal note |
| POST | `/api/requests/:id/retry-classification` | Retry failed AI |

### Webhooks
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/webhooks/inbound` | Simulate WhatsApp/email/website inbound |

---

## Security

- JWT for all protected routes (24h expiry)
- bcrypt password hashing (12 rounds)
- Input validation via Zod schemas on all endpoints
- Rate limiting: 100 req/15min (general), 20 req/15min (auth)
- Helmet.js security headers
- No secrets in frontend or git (`.env` gitignored)
- Webhook signature validation scaffold (HMAC-SHA256) included
- **Prompt injection safety**: user messages are treated as untrusted text passed as quoted input to the AI, never as instructions

---

## AI Workflow

The AI layer is a replaceable module (`src/ai/classifier.js`).

**Mock provider** (default): Uses keyword matching for instant, deterministic classification. No API key needed.

**OpenAI provider**: Set `AI_PROVIDER=openai` and `OPENAI_API_KEY` in `.env`. Uses `gpt-3.5-turbo` with a strict structured JSON prompt. Falls back to mock on failure.

**Output shape:**
```json
{
  "category": "support",
  "priority": "high",
  "summary": "Customer cannot access dashboard after payment.",
  "confidence": 0.86,
  "reason": "Payment + login issue requires fast response.",
  "provider": "mock"
}
```

---

## Known Limitations & What I'd Improve With 2 More Weeks

1. **Tests**: Add Jest/Vitest tests for all API routes and the classification worker
2. **Docker Compose**: Package API + Worker + Redis + Postgres together
3. **Role-based UI**: Admin vs agent views with different permissions
4. **Better AI**: Integrate LangChain with a routing skill that assigns to specific queues/agents
5. **Metrics dashboard**: Charts for volume, resolution time, category distribution
6. **Email notifications**: Notify agents when high-priority requests arrive
7. **Webhook signature validation**: Fully implement HMAC for WhatsApp/email providers
8. **Audit log UI**: Expose the full `request_events` timeline in the dashboard