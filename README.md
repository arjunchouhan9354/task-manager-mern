# Task Manager

A simple, secure task manager: sign up, log in, and create, edit, delete and organise your own tasks with status, priority and due dates, plus search, filters, sorting and pagination.

**Live app:** `[add Render URL]` · **Demo login:** `demo@taskmanager.dev` / `Demo@1234` (or click **Use demo account**)
> Hosted on Render's free tier: the first load after a period of inactivity can take up to a minute while the server wakes up.

**Video walkthrough:** `[add video link]`

---

## Features

- **Accounts:** register, log in, log out; the session survives a page refresh.
- **Tasks:** title, description, status (To do / In progress / Done), priority (Low / Medium / High), due date.
- **Quick status change** straight from the list (the screen updates instantly; if saving fails, it's put back).
- **Find tasks:** search by title, filter by status and priority, sort (newest, oldest, due soonest, priority), pagination.
- **At a glance:** counts per status (click to filter), overdue and due-today badges.
- **Filters live in the URL**, so a refresh or a shared link keeps the same view.
- Loading, empty and error states, toast messages, responsive layout (mobile to desktop).
- Each user only ever sees and changes **their own** tasks.

## Tech stack

| Layer | Technology |
|---|---|
| Front-end | React 19, Vite, React Router, axios, Tailwind CSS, react-hot-toast (plain `useState`/`useEffect` + one `AuthContext`) |
| Back-end | Node.js, Express 5, Mongoose, Zod (validation), JWT in an httpOnly cookie, bcryptjs, Helmet, express-rate-limit |
| Database | MongoDB Atlas |
| Tests | Node.js test runner, Supertest, mongodb-memory-server |
| Deployment | One Render web service (Express serves the API and the React build) |

## Project structure

```
task-manager/
├── server/                     Express API
│   ├── src/
│   │   ├── app.js / server.js  app setup / start + graceful shutdown
│   │   ├── config/  db/        environment variables / MongoDB connection
│   │   ├── models/             User, Task
│   │   ├── validation/         Zod rules for each request
│   │   ├── middleware/         auth (login cookie), validate, error
│   │   ├── controllers/        auth.controller.js, task.controller.js
│   │   ├── routes/             /api/auth, /api/tasks
│   │   ├── utils/token.js      JWT + cookie helpers
│   │   └── scripts/seed.js     demo account + sample tasks
│   └── tests/                  API tests
└── client/                     React app
    └── src/
        ├── api/                axios calls (auth.js, tasks.js)
        ├── context/            AuthContext (logged-in user)
        ├── pages/              Login, Register, Tasks, Not found
        ├── components/         TaskCard, TaskForm, FiltersBar, Modal, …
        └── lib/                validate.js (form checks), format.js (labels, dates)
```

Request flow on the server: **route → middleware (login check, input check) → controller → model → MongoDB**. Every response has the same shape:
```json
{ "error": false, "status": 200, "message": "Task updated successfully.", "data": { } }
{ "error": true,  "status": 400, "message": "Please check the highlighted fields.", "errors": [{ "field": "title", "message": "Title is required" }] }
```

## Run it locally

Requirements: Node.js 20+ and a MongoDB connection string (MongoDB Atlas free tier works).

```bash
# 1. API
cd server
npm install
cp .env.example .env        # set MONGODB_URI and JWT_SECRET
npm run seed                # demo user + sample tasks
npm run dev                 # http://localhost:5000

# 2. React app (second terminal)
cd client
npm install
npm run dev                 # http://localhost:5173  (calls to /api go to :5000)
```

| Where | Command | What it does |
|---|---|---|
| `server/` | `npm run dev` | API with auto-restart |
| `server/` | `npm test` | API tests against an in-memory MongoDB (no setup needed) |
| `server/` | `npm run seed` | Create/reset the demo account with 8 sample tasks |
| `server/` | `npm start` | Production server: API under `/api` + the built React app |
| `client/` | `npm run dev` | React app in development |
| `client/` | `npm run build` | Build the React app into `client/dist` |

### Environment variables (`server/.env`)

| Variable | Example | Notes |
|---|---|---|
| `MONGODB_URI` | `mongodb+srv://…/task-manager` | Required |
| `JWT_SECRET` | long random string | Required. In production at least 32 characters, or the server won't start. Generate: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN` | `1d` | Session length |
| `PORT` | `5000` | |
| `NODE_ENV` | `development` / `production` | `production` turns on the `Secure` cookie flag |

## Deployment (Render)

1. Push this repository to GitHub.
2. Render → **New Web Service** → connect the repo.
3. **Build command:** `cd client && npm install --include=dev && npm run build && cd ../server && npm install`
4. **Start command:** `cd server && npm start`
5. Environment: `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET` (random, 32+ characters), `JWT_EXPIRES_IN=1d`.
6. MongoDB Atlas → Network Access → allow `0.0.0.0/0` (Render uses changing IP addresses).
7. After the first deploy, run `npm run seed` once **from your laptop** (inside `server/`, with `MONGODB_URI` in `.env` pointing to the same Atlas database) to create the demo account. Render's free tier has no shell, and the seed only needs database access.

## API

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | – | Health check |
| POST | `/api/auth/register` | – | `{ name, email, password }` → creates the user and logs in (cookie) |
| POST | `/api/auth/login` | – | `{ email, password }` → logs in (cookie) |
| POST | `/api/auth/logout` | – | Clears the cookie |
| GET | `/api/auth/me` | ✅ | Current user |
| GET | `/api/tasks` | ✅ | List. Query: `status`, `priority`, `q`, `sort` (`newest`·`oldest`·`due_soon`·`priority`), `page`, `limit` (≤ 50). Returns `data` + `meta { page, limit, total, totalPages, counts }` |
| POST | `/api/tasks` | ✅ | Create `{ title, description?, status?, priority?, dueDate? }` |
| GET | `/api/tasks/:id` | ✅ | One task |
| PATCH | `/api/tasks/:id` | ✅ | Update any of the fields |
| DELETE | `/api/tasks/:id` | ✅ | Delete |

Status codes: `400` invalid input (with field errors), `401` not logged in, `404` not found (including another user's task), `409` email already registered, `429` too many login attempts.

## Key decisions

1. **One deployable service and plain JavaScript, with strict validation at the API.** The API and the React app are separate folders but served from one website address, so the httpOnly login cookie works in every browser (no third-party cookies) and no CORS setup is needed. I chose JavaScript over TypeScript to deliver a complete, tested and deployed app within 24 hours; every request is checked with Zod before it reaches a controller, which is where bad input is actually stopped.
2. **Security and data ownership from the start.** Every task query includes the user ID from the verified login cookie, so another user's task returns 404 (covered by a test). Passwords are hashed with bcrypt, the JWT lives in an httpOnly, SameSite=Lax cookie (not localStorage), login/register are rate-limited, Helmet sets security headers, and login gives the same message in the same time for a wrong email or a wrong password (bcrypt always runs), so it can't be used to find registered emails. In production the server refuses to start with a JWT secret shorter than 32 characters.
3. **Server-side data handling with a simple, responsive UI.** Filtering, search, sorting and pagination run on the server with indexes; three queries run in parallel to return the page, the total and the per-status counts, with correct ordering for "due soonest" (no due date last) and priority (high → low). The front-end deliberately uses plain React state and axios (no extra state libraries for an app this size); the status change updates the screen instantly and rolls back if saving fails.

## Deliberately not implemented

1. **Shared tasks and real-time collaboration:** permissions, roles and conflicting edits are a large scope beyond a simple task manager. Every task already has an owner, so sharing could be added later with a members list and Socket.io.
2. **Reminders and notifications:** would need a job scheduler/queue and an email provider; extra infrastructure that doesn't improve the core flow. Due dates are stored and indexed, ready for a scheduled job.
3. **File attachments:** would need cloud storage (e.g. S3), secure uploads (type/size checks, presigned URLs) and image processing; a secondary feature compared with finishing, testing and deploying the core.

## Known limitation (next step with one more day)

Authentication uses **one JWT valid for a day, without refresh tokens or server-side revocation**. Logging out clears the browser cookie, but a stolen token would stay valid until it expires, and there's no "log out of all devices". Next step: short-lived access tokens plus refresh tokens stored hashed in MongoDB, rotated on every use and revoked on logout or password change.

## Tests

```bash
cd server && npm test
```
18 API tests (Node.js test runner + Supertest + in-memory MongoDB) covering registration, login, the session cookie, validation errors, task create/read/update/delete, filters, search (including special characters), sorting, pagination, status counts, `completedAt` handling, and that **one user can't read, update or delete another user's task**.