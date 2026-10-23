# EventEase : Workshop Registration That Never Overbooks

[![React](https://img.shields.io/badge/React-Vite-61DAFB?logo=react&logoColor=black)](client/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](server/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](server/models/)
[![Node.js](https://img.shields.io/badge/Node.js-24-339933?logo=node.js&logoColor=white)](server/)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?logo=vercel&logoColor=white)](https://eventease-weld.vercel.app)
[![Render](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render&logoColor=black)](https://eventease-0pnk.onrender.com/api/events)
[![Stress Test](https://img.shields.io/badge/Stress_Test-50_requests_→_10_seats_→_PASS-4E9A06)](#proof-no-overbooking-under-load)

> **A registration system for technical workshops, built so the seat limit holds even when everyone clicks at once.**
> Create workshops, register participants, block duplicate sign-ups, and stop exactly at capacity, enforced by the database rather than by hopeful checks in code.

Built for the **Codeio Junior Coordinator – Technical recruitment task (Track 1, Project 3: EventEase)**.

**Live app → [eventease-weld.vercel.app](https://eventease-weld.vercel.app)**
**API → [eventease-0pnk.onrender.com/api/events](https://eventease-0pnk.onrender.com/api/events)**

> The backend runs on Render's free tier, which sleeps after ~15 minutes of inactivity. The first request after that can take up to a minute while it wakes up. After that, it's fast.

> **Reviewers:** Organise mode is protected by an admin key. The key is included in the submission form rather than here, because this repository is public.

---

## Table of Contents

1. [The Problem](#the-problem)
2. [Features](#features)
3. [Using the App](#using-the-app)
4. [Proof: No Overbooking Under Load](#proof-no-overbooking-under-load)
5. [System Architecture](#system-architecture)
6. [How Registration Works](#how-registration-works)
7. [Design Decisions](#design-decisions)
8. [Data Model](#data-model)
9. [API Reference](#api-reference)
10. [Project Directory Layout](#project-directory-layout)
11. [Run It Locally](#run-it-locally)
12. [Deployment](#deployment)
13. [Known Limitations](#known-limitations)
14. [Roadmap](#roadmap)

---

## The Problem

A workshop has 40 seats. The registration link goes out in a group chat, and 100 people open it in the same minute.

The obvious implementation checks "are seats left?" and then saves the registration. When two requests arrive together, **both checks pass before either save happens**, and the event ends up with 41 people. The same race lets one person register twice by double-clicking.

The task asks for duplicate-registration prevention and seat-limit management. EventEase treats both as **concurrency problems**, not as form validation.

---

## Features

- **Event creation** — title, venue, date and time, capacity, and an optional description
- **Participant registration** — name and email, from each event's detail panel
- **Duplicate-registration prevention** — one registration per email per event, case-insensitive (`A@x.com` and `a@x.com` are the same person)
- **Seat-limit management** — registrations stop exactly at capacity, even under simultaneous requests
- **Attendee list** — every registration for an event, in the order people signed up, updating live as seats fill
- **Organiser access** — creating events and viewing attendee lists require an admin key, so attendee emails aren't public
- **Clear feedback** — the frontend shows the backend's own error messages ("already registered", "event is full") instead of a generic failure

---

## Using the App

The app has two modes, switched with the tabs at the top right.

**Register** (open to everyone)
1. Pick a workshop from the list. Each card shows how many seats are left.
2. Enter your name and email in the details panel and register.
3. Registering twice with the same email, or for a full event, shows a clear message instead.

**Organise** (admin key required)
1. Enter the admin key to unlock. It's checked by the server, not the browser.
2. Create a workshop with the form at the top.
3. Pick any event to see its attendee list, numbered in sign-up order.

Refreshing the page locks Organise mode again; the key is never stored in the browser.

---

## Proof: No Overbooking Under Load

[`server/scripts/stressTest.js`](server/scripts/stressTest.js) creates a fresh 10-seat event, then fires **50 registration requests at the same moment** (`Promise.all`, no waiting between them), and finally checks the database itself.

```
Capacity:            10
Requests sent:       50 (simultaneously)
Succeeded (201):     10
Rejected (409):      40
seatsTaken in DB:    10
Registrations in DB: 10
PASS: no overbooking
```

It checks two things, not one: that `seatsTaken` never exceeds capacity, **and** that the seat counter matches the number of registrations actually stored. A counter that is correct while the registrations are wrong would still fail.

---

## System Architecture

```
            +--------------------------------------+
            |   Browser                            |
            |   React (Vite) single-page app       |
            |   Hosted on Vercel                   |
            +--------------------------------------+
                              |
                              |  fetch()  JSON over HTTPS
                              |  base URL from VITE_API_URL
                              v
            +--------------------------------------+
            |   Express API  (Node.js)             |
            |   Hosted on Render                   |
            |                                      |
            |   middleware: cors(), express.json() |
            |   requireAdmin on organiser routes   |
            +--------------------------------------+
                              |
                              |  Mongoose
                              v
            +--------------------------------------+
            |   MongoDB Atlas                      |
            |                                      |
            |   events          registrations      |
            |   (seatsTaken)    (unique index on   |
            |                    event + email)    |
            +--------------------------------------+
```

The server only starts accepting requests **after** the database connection succeeds, so there is never a window where a registration could arrive with nowhere to be saved.

---

## How Registration Works

`POST /api/events/:id/register` runs four steps:

```
  1. Validate input        name and email present?        no  → 400
                                      |
  2. Find the event        does this event exist?         no  → 404
                                      |
  3. Save registration     unique index on (event, email)
                           already registered?            yes → 409
                                      |
  4. Reserve a seat        ONE atomic operation:
                           "find this event WHERE seatsTaken < capacity
                            AND increment seatsTaken by 1"
                                      |
                     matched? ── no ──→ delete the registration from step 3 → 409 (full)
                                      |
                                     yes
                                      |
                                      v
                                     201 Created
```

Steps 3 and 4 are where the concurrency guarantees live. Both are enforced **inside MongoDB**, which processes them one at a time per document, so no two requests can slip through together.

---

## Design Decisions

**Duplicates are blocked by the database, not by a check in code.**
A unique compound index on `(event, email)` makes MongoDB refuse a second registration for the same event, returning error code `11000`, which the API turns into `409 Conflict`. A "look it up first, then save" approach fails under concurrency because both lookups find nothing. Emails are lowercased by the schema before saving, so capitalisation can't be used to register twice.

**Seats are reserved with a single atomic update.**
`findOneAndUpdate` matches the event *only if* `seatsTaken < capacity` (a `$expr` comparison between two fields of the same document) and applies `$inc: { seatsTaken: 1 }` in the same operation. If the event is full, nothing matches and it returns `null`. There is no gap between checking and updating for another request to land in.

**Failed seat reservations roll back the registration.**
Registration is saved before the seat is reserved, so a duplicate is rejected before it can take a seat. If no seat is available, that registration is deleted, so nobody is left "registered" without a seat.

**Organiser routes are protected by middleware.**
A `requireAdmin` middleware checks the `x-admin-key` header on the create-event and attendee routes, and returns `401` if it's missing or wrong. It fails closed: if `ADMIN_KEY` isn't configured on the server, every organiser request is refused rather than allowed. The frontend verifies a key against `GET /api/admin/check` before unlocking Organise mode, and keeps it only in memory.

**Status codes mean something.**
`201` created · `400` invalid input or malformed ID · `401` missing or wrong admin key · `404` event not found · `409` duplicate or full · `500` server failure. The frontend displays the backend's error message directly, so the server is the single place those messages are written.

**Dates are converted to UTC in the browser.**
The `datetime-local` picker returns a time with no timezone. The client converts it with `toISOString()` before sending, because the browser knows the user is in India and the server (in UTC on Render) does not. A 4 PM workshop is stored as 4 PM IST, not 4 PM UTC.

**The frontend derives the selected event instead of copying it.**
The app stores only the selected event's **ID** and looks it up from the freshly fetched list on every render. Storing a copy would leave the details panel showing stale seat counts after a registration.

**Secrets live in environment variables.**
`MONGO_URI` and `ADMIN_KEY` are read from `server/.env` locally and from Render's environment settings in production. `.env` is gitignored. The frontend's API address comes from `VITE_API_URL`, so the same code runs locally and in production.

---

## Data Model

### `Event`

| Field | Type | Rules |
|---|---|---|
| `title` | String | required, trimmed |
| `venue` | String | required, trimmed |
| `date` | Date | required, stored in UTC |
| `capacity` | Number | required, minimum 1 |
| `seatsTaken` | Number | defaults to 0; only ever changed by the atomic update |
| `description` | String | optional |
| `createdAt`, `updatedAt` | Date | added automatically (`timestamps: true`) |

### `Registration`

| Field | Type | Rules |
|---|---|---|
| `event` | ObjectId → `Event` | required; stores a reference, not a copy |
| `name` | String | required, trimmed |
| `email` | String | required, trimmed, **lowercased** |
| `createdAt`, `updatedAt` | Date | added automatically; `createdAt` orders the attendee list |

**Index:** `{ event: 1, email: 1 }`, **unique** — the duplicate-prevention guarantee.

---

## API Reference

Base URL: `https://eventease-0pnk.onrender.com/api`

| Method | Endpoint | Description | Auth | Success | Errors |
|---|---|---|---|---|---|
| `GET` | `/events` | List all events, soonest first | — | `200` | `500` |
| `POST` | `/events` | Create an event | 🔒 admin key | `201` | `400` validation · `401` |
| `GET` | `/events/:id` | Get one event | — | `200` | `400` malformed ID · `404` |
| `POST` | `/events/:id/register` | Register for an event | — | `201` | `400` · `404` · `409` duplicate · `409` full |
| `GET` | `/events/:id/attendees` | List registrations, in sign-up order | 🔒 admin key | `200` | `400` · `401` |
| `GET` | `/admin/check` | Verify an admin key | 🔒 admin key | `200` | `401` |

Protected routes expect the key in an `x-admin-key` header.

### Example: create an event

```http
POST /api/events
Content-Type: application/json
x-admin-key: <your-admin-key>

{
  "title": "Intro to React",
  "venue": "CSE Seminar Hall",
  "date": "2026-11-05T10:30:00.000Z",
  "capacity": 40,
  "description": "Components, state and hooks from scratch."
}
```

### Example: register

```http
POST /api/events/<eventId>/register
Content-Type: application/json

{ "name": "Vaanya", "email": "vaanya@example.com" }
```

| Situation | Status | Response body |
|---|---|---|
| Registered | `201` | the saved registration |
| Missing name or email | `400` | `{ "error": "Name and email are required" }` |
| Event doesn't exist | `404` | `{ "error": "Event not found" }` |
| Already registered | `409` | `{ "error": "you are already registered for this event" }` |
| Event is full | `409` | `{ "error": "Sorry, this event is full" }` |

---

## Project Directory Layout

```text
eventease/
├── README.md
│
├── server/                         # Express API
│   ├── index.js                    # App setup, middleware, routes, DB connection
│   ├── models/
│   │   ├── Event.js                # Event schema
│   │   └── Registration.js         # Registration schema + unique (event, email) index
│   ├── scripts/
│   │   └── stressTest.js           # 50 simultaneous registrations → 10 seats
│   ├── package.json
│   ├── .gitignore                  # node_modules, .env
│   └── .env                        # MONGO_URI, ADMIN_KEY (gitignored, never committed)
│
└── client/                         # React app (Vite)
    ├── index.html
    ├── package.json
    └── src/
        ├── main.jsx                # Entry point
        ├── App.jsx                 # Modes, event list, details panel, registration, unlock
        ├── CreateEventForm.jsx     # Create-event form (sends admin key)
        ├── AttendeeList.jsx        # Attendee list (sends admin key), refetches when seats change
        ├── api.js                  # API base URL (VITE_API_URL or localhost)
        ├── App.css                 # Layout and components
        └── index.css               # Colour palette and base styles
```

---

## Run It Locally

**Requirements:** Node.js 18+ and a MongoDB connection string (a free MongoDB Atlas cluster works).

### 1. Backend

```bash
git clone https://github.com/vaanyaagarwal27/eventease.git
cd eventease/server
npm install
```

Create `server/.env`:

```
MONGO_URI=your_mongodb_connection_string
ADMIN_KEY=any_long_random_string
```

Start it:

```bash
npm start
```

You should see `Connected to MongoDB` and `Server listening on port 3000`.

### 2. Frontend

In a second terminal:

```bash
cd eventease/client
npm install
npm run dev
```

Open `http://localhost:5173`. The client talks to `http://localhost:3000/api` by default; set `VITE_API_URL` in `client/.env` to point it anywhere else. Use the `ADMIN_KEY` from your `.env` to unlock Organise mode.

### 3. Stress test

With the backend running:

```bash
cd eventease/server
node scripts/stressTest.js
```

The script reads `ADMIN_KEY` from `.env` to create its test event. Each run creates a new "Stress Test" event in the database.

---

## Deployment

Both halves deploy automatically on every push to `main`.

| | Backend | Frontend |
|---|---|---|
| **Host** | Render (Web Service, free tier) | Vercel |
| **Root directory** | `server` | `client` |
| **Build command** | `npm install` | `npm run build` (Vite preset) |
| **Start command** | `npm start` | — (static files) |
| **Environment** | `MONGO_URI`, `ADMIN_KEY` | `VITE_API_URL=https://eventease-0pnk.onrender.com/api` |
| **Port** | `process.env.PORT`, assigned by Render | — |

`VITE_` variables are baked into the frontend at build time, so changing `VITE_API_URL` requires a redeploy.

---

## Known Limitations

Better stated here than found later.

- **One shared admin key, not organiser accounts.** Anyone with the key has full organiser access, and there's no way to tell organisers apart or revoke one person's access without changing the key for everyone.
- **Registration and seat reservation are two operations, not one transaction.** Each is atomic on its own and the stress test passes, but if the server crashed in the instant between saving a registration and rolling it back, an orphaned registration could remain. A MongoDB transaction would close this completely.
- **No editing or cancelling.** Events can't be edited or deleted, and participants can't cancel a registration (which would also need to free a seat).
- **Cold starts.** The free Render instance sleeps when idle, so the first request after a quiet period is slow.

---

## Roadmap

| Next | What it involves |
|---|---|
| **Organiser accounts** | Individual logins (hashed passwords + JWT) instead of one shared key, so access can be granted and revoked per person. |
| **Cancel registration** | Delete the registration and atomically decrement `seatsTaken`, the mirror image of reserving. |
| **Waitlist** | When an event is full, queue the registration instead of rejecting it, and promote the first person in line when someone cancels. |
| **Transactions** | Wrap "save registration" and "reserve seat" in one MongoDB transaction so they succeed or fail together. |
| **Automated tests** | Jest + Supertest for every route and status code, with the stress test running in CI. |

---

## Author

**Vaanya Agarwal** ([@vaanyaagarwal27](https://github.com/vaanyaagarwal27)) — second-year Computer Science, BMS College of Engineering, Bengaluru.

Built step by step: each route was tested in isolation (Thunder Client) before the next one was started, and the commit history shows that progression.
