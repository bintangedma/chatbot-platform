# Chatbot Platform

A production-ready Chatbot Platform allowing users to register, log in, configure chatbot workspaces (projects) with custom system prompt templates, upload knowledge-base document attachments, and perform real-time, interactive SSE-streaming completions.

## Features

- **JWT Auth & Session Rotation**: Secure access tokens combined with HTTP-Only cookie-based refresh tokens. Complete with token-refresh rotation and Axios request-queue interceptors.
- **Project Workspaces**: Custom prompts settings per agent. List view includes active subqueries counting messages and files, plus detailed configurations.
- **Completions Streaming**: Pipes completions token-by-token from the OpenRouter API back to the user via Server-Sent Events (SSE).
- **Documents Manager**: Standard multi-part file uploads (PDF, TXT, MD, CSV, JSON, DOCX) validated on format/size (max 20MB) and managed via the OpenAI Files API.
- **Standardized Response Envelopes**: Consistent API response bodies for success (`{ success: true, data: ... }`) and errors (`{ success: false, error: CODE, message: ... }`).
- **Modern Responsive UI**: Premium dark mode design configured with Tailwind CSS, custom loaders, and micro-transition states.

---

## Tech Stack

### Backend
- **Core**: Python 3.11+, FastAPI (ASGI server)
- **DB**: PostgreSQL, SQLAlchemy 2.0 (asyncio), Alembic (migrations)
- **Security**: python-jose (JWT), passlib[bcrypt] (password hashing)
- **LLM/HTTP**: httpx (async connections)
- **Middleware**: slowapi (rate limiting)

### Frontend
- **Core**: React 18, TypeScript, Vite
- **Routing**: React Router v6
- **State**: Zustand (global and persist), TanStack Query (server caching)
- **Styling**: Tailwind CSS, Lucide React

---

## Prerequisites

- **Python**: 3.11 or later
- **Node.js**: 18.0 or later
- **PostgreSQL**: 15.0 or later
- **API Keys**:
  - **OpenRouter Key**: From [OpenRouter](https://openrouter.ai/) for completions.
  - **OpenAI Key**: From [OpenAI](https://platform.openai.com/) for assistants file upload.

---

## Local Setup

### 1. Database Setup
Create a PostgreSQL database named `chatbot_platform`:
```sql
CREATE DATABASE chatbot_platform;
```

### 2. Backend Config & Run
Navigate to `/backend`:
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```
Edit `.env` and fill in database credentials and API keys.

Run database migrations:
```bash
alembic upgrade head
```

Start backend webserver:
```bash
uvicorn app.main:app --reload --port 4000
```
Server Swagger documentation will be available at `http://localhost:4000/docs`.

### 3. Frontend Config & Run
Navigate to `/frontend`:
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
Open browser at `http://localhost:5173`.

---

## Docker Compose Setup

Run the entire suite locally using Docker:
```bash
docker-compose up --build
```
This spawns:
- **postgres**: Exposes port `5432` mapping tables.
- **backend**: Exposes port `4000`.
- **frontend**: Exposes port `5173`.

---

## API Reference

| Endpoint | Method | Security | Description |
|---|---|---|---|
| `/api/v1/auth/register` | `POST` | Public | Registers a new account, sets refresh cookie |
| `/api/v1/auth/login` | `POST` | Public | Verifies password, returns access token, sets cookie |
| `/api/v1/auth/refresh` | `POST` | Public | Rotates refresh cookie, issues new access token |
| `/api/v1/auth/logout` | `POST` | Public | Clears refresh tokens from DB and deletes cookie |
| `/api/v1/auth/me` | `GET` | Bearer JWT | Returns the current user profile details |
| `/api/v1/projects` | `POST` | Bearer JWT | Creates a new chatbot agent workspace |
| `/api/v1/projects` | `GET` | Bearer JWT | Lists all projects with message and file counts |
| `/api/v1/projects/{project_id}` | `GET` | Bearer JWT | Details of project (last 10 messages, all files) |
| `/api/v1/projects/{project_id}` | `PUT` | Bearer JWT | Edits name and/or system instructions |
| `/api/v1/projects/{project_id}` | `DELETE` | Bearer JWT | Deletes project and its cascade dependencies |
| `/api/v1/projects/{project_id}/chat` | `POST` | Bearer JWT | Submits user prompt and returns SSE tokens stream |
| `/api/v1/projects/{project_id}/messages` | `GET` | Bearer JWT | Retrieves paginated historical message log list |
| `/api/v1/projects/{project_id}/files` | `POST` | Bearer JWT | Uploads file to OpenAI Files API, saves DB metadata |
| `/api/v1/projects/{project_id}/files` | `GET` | Bearer JWT | Lists all files mapped to the project |
| `/api/v1/projects/{project_id}/files/{file_id}` | `DELETE` | Bearer JWT | Removes file from OpenAI Files API and deletes from DB |
| `/health` | `GET` | Public | Returns status status code 200 "ok" check |

---

## Environment Variables

### Backend (`/backend/.env`)
| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | N/A | Async connection string (e.g. `postgresql+asyncpg://...`) |
| `JWT_ACCESS_SECRET` | N/A | Secret key used to sign access JWTs |
| `JWT_REFRESH_SECRET` | N/A | Secret key used to sign refresh JWTs |
| `JWT_ACCESS_EXPIRY_MINUTES` | `15` | Lifetime of access tokens |
| `JWT_REFRESH_EXPIRY_DAYS` | `7` | Lifetime of refresh tokens |
| `OPENROUTER_API_KEY` | N/A | Authorization key for completions |
| `OPENROUTER_MODEL` | `openai/gpt-4o-mini` | Prompt completions model ID |
| `OPENAI_API_KEY` | N/A | Authorization key for files upload |
| `FRONTEND_URL` | `http://localhost:5173` | Allowed CORS client address |
| `PORT` | `4000` | Port of ASGI server |
| `ENVIRONMENT` | `development` | Development or production trigger |

### Frontend (`/frontend/.env`)
| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:4000/api/v1` | URL target for backend endpoints calls |
