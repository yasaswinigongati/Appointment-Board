# Appointment Board

A simple team appointment board built with **React**, **FastAPI**, and **SQLite** (free, zero-config). You can view, add, edit, complete, and cancel appointments, filter by date or status, and overlapping time slots are blocked.

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend | React + Vite | Fast, free, widely used |
| Backend | Python FastAPI | Clear REST API, validation built in |
| Database | SQLite | No server install; swap-ready for PostgreSQL/MySQL later |
| Theme | Light / dark toggle | Preference is saved in localStorage |

## How the application works

1. The React UI loads appointments from `GET /api/appointments`.
2. Filters (date, status) are sent as query parameters and applied on the server.
3. Adding or editing sends title, description, date, start time, and end time.
4. The API validates required fields and that **end time is after start time**.
5. Before saving, the API checks for **overlapping time slots** on the same date among non-cancelled appointments. Overlaps return HTTP 409 with a clear message.
6. Complete / cancel update status. Cancelled appointments stay on the board and are visually marked.
7. Success and error feedback appears as toast messages (and form errors for validation).

## Assumptions

- One shared team board (no login / multi-user roles).
- A time slot conflict is any overlap on the same calendar date between appointments that are **scheduled** or **completed**. Cancelled appointments free the slot.
- Sample data is seeded automatically on first startup when the database is empty.
- Times are treated as local wall-clock times for a single timezone (the team’s local day).
- SQLite file lives at `backend/appointments.db`.

## Project structure

```
Assignment/
├── backend/
│   ├── app/
│   │   ├── main.py          # App, CORS, seed data
│   │   ├── models.py        # SQLAlchemy models
│   │   ├── schemas.py       # Request/response validation
│   │   ├── services.py      # Conflict checks & CRUD
│   │   ├── routers.py       # API routes
│   │   └── database.py      # SQLite engine/session
│   └── requirements.txt
├── frontend/                # React (Vite) UI
└── README.md
```

## Setup (all free)

### 1. Backend

```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

API docs: http://127.0.0.1:8000/docs

### 2. Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://127.0.0.1:5173 (or the Local URL printed by Vite if the port is busy).

Vite proxies `/api` to the FastAPI server, so no CORS hassle during local development.

## API overview

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/appointments?date=&status=` | List / filter |
| POST | `/api/appointments` | Create |
| PUT | `/api/appointments/{id}` | Update |
| POST | `/api/appointments/{id}/complete` | Mark completed |
| POST | `/api/appointments/{id}/cancel` | Cancel (still visible) |
| GET | `/api/health` | Health check |

## Features for review

- Sample appointments ready on first launch
- Add / edit form with client + server validation
- Filter by date and status
- Complete and cancel actions
- Overlap prevention with clear error messaging
- Light / dark mode with smooth transitions and light UI motion
- Cancelled appointments remain visible and clearly marked

## Optional: PostgreSQL / MySQL later

Change `DATABASE_URL` in `backend/app/database.py` to a Postgres or MySQL URL and install the matching driver (`psycopg2-binary` or `pymysql`). The models and API stay the same.
