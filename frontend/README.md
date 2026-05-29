# Cognifyr Routing

AI-powered smart support request routing system.

## Tech Stack

- **Backend:** Node.js, Express, Prisma, PostgreSQL (Supabase)
- **Queue:** BullMQ + Redis
- **Realtime:** Socket.io
- **AI:** OpenAI API
- **Frontend:** React + Vite + Tailwind

## Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/cognifyr-routing.git
cd cognifyr-routing
```

### 2. Setup backend
```bash
cd backend
npm install
cp .env.example .env   # fill in your values
npx prisma migrate dev --name init
npm run dev
```

### 3. Setup frontend
```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
cognifyr-routing/
├── backend/
│   ├── src/
│   │   ├── routes/       # auth, requests, webhooks
│   │   ├── workers/      # BullMQ classification worker
│   │   ├── services/     # ai/, queue/, realtime/
│   │   ├── middleware/   # auth, validation, rateLimiter
│   │   ├── db/           # Prisma schema + migrations
│   │   └── index.js
│   └── .env.example
├── frontend/
│   └── src/
│       ├── pages/        # Login, Dashboard, RequestDetail
│       ├── components/   # RequestList, RequestCard, Notes
│       └── socket.js
└── README.md
```

## API Endpoints (Phase 2+)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login + get JWT |
| GET | /api/requests | List all requests |
| POST | /api/requests | Create request |
| GET | /api/requests/:id | Get single request |
| PATCH | /api/requests/:id | Update request |

## Roadmap

- [x] Phase 1 — Project setup
- [ ] Phase 2 — Auth + DB
- [ ] Phase 3 — BullMQ + AI
- [ ] Phase 4 — Realtime
- [ ] Phase 5 — Frontend
- [ ] Phase 6 — Security + Deploy