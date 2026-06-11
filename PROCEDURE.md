# User Manual & Technical Walkthrough (PROCEDURE.md)

Welcome to the Chatbot Platform! This document outlines exactly how to get started with the application and provides an in-depth breakdown of what is happening under the hood at each stage.

---

## Part 1: Step-by-Step User Guide

### Step 1: Register an Account
1. Open your browser and navigate to **[http://localhost:5173/register](http://localhost:5173/register)**.
2. Enter your Name, Email (case-insensitive), and a secure Password (minimum 8 characters, must include at least one number).
3. Click **Create Account**. You will be logged in automatically and redirected to the **Dashboard**.

### Step 2: Create a Chatbot Project
1. On the **Dashboard**, click the **New Project** button.
2. In the modal, enter a name for your chatbot (e.g., `Customer Support Bot`) and optional system prompt instructions (e.g., `You are a professional assistant for a cloud hosting company. Keep answers concise.`).
3. Click **Create Project**. The new project tile will appear in the grid.

### Step 3: Open the Project Workspace
1. Click the **Open** button on your new project card (or click the project name in the left navigation sidebar).
2. You are now inside the **Two-Panel Project Workspace**:
   - **Left Column**: System instructions configuration panel and the Knowledge Base document uploader.
   - **Right Column**: Interactive Chat Playpen.

### Step 4: Upload Knowledge Base Documents
1. In the left panel under **Knowledge Base Documents**, click **Upload Document**.
2. Select a PDF, TXT, MD, CSV, JSON, or DOCX file (under 20MB).
3. The uploading indicator will animate, and the file metadata will populate in the documents list with a clickable delete trash can icon.

### Step 5: Start a Chat Session (SSE Streaming)
1. Type a message in the chat input at the bottom right column (e.g., `Hello! How do I reset my account password?`).
2. Press **Enter** (or click the send button).
3. The user query is immediately rendered in a blue bubble, a bouncing typing indicator is displayed, and tokens from the assistant reply stream in real time.
4. While streaming, the input bar and send button are disabled to prevent double-submissions.

### Step 6: Test Token Expiry & Logout
1. Open your browser developer console (F12) and check the `Application -> Local Storage` tab. You will see your cached `accessToken` stored under `chatbot-platform-auth`.
2. When the token expires (after 15 minutes), any subsequent API request will trigger a silent backend refresh mutation (`POST /auth/refresh`), rotating your access token seamlessly without disrupting your chat session.
3. Click **Logout** in the top-right header to flush local storage, delete database session rows, clear browser cookies, and redirect to the login view.

---

## Part 2: Under the Hood (Technical Architecture)

Here is a step-by-step description of what happens inside the code at each action stage:

```
                  ┌────────────────────────────────────────────────────────┐
                  │                 USER STARTS ACTIONS                    │
                  └────────────────────────────────────────────────────────┘
                                               │
             ┌─────────────────────────────────┴────────────────────────────────┐
             ▼                                 ▼                                ▼
┌─────────────────────────┐       ┌─────────────────────────┐      ┌─────────────────────────┐
│     1. AUTHENTICATING   │       │   2. UPLOADING FILES    │      │    3. SSE STREAM CHAT   │
└─────────────────────────┘       └─────────────────────────┘      └─────────────────────────┘
 - Pydantic case-normalizes        - Backend limits size to 20MB    - User msg saved immediately
   the Email input.                  and checks strict MIME types.  - OpenRouter API stream
 - Native bcrypt generates a       - httpx streams binary payload     connection initialized.
   secure salt and hashes            to OpenAI Files API.           - GeneratorExit catches
   the credentials.                - Database inserts metadata        client disconnect and
 - Generates JWT token pairs,        row indexed on project_id.       saves partial tokens.
   setting Refresh token hash                                       - Background database task
   in DB & HttpOnly cookie.                                           persists completed chat.
```

### 1. Registration & Security Stage
- **Email Normalization**: Pydantic's `lowercase_email` validator normalizes all input emails to lowercase at the API boundaries.
- **Direct bcrypt Hashing**: The backend calls Python's native `bcrypt` package to encode, salt, and hash the password, bypassing the deprecated `passlib` layers.
- **Double Secret Signature**: The server signs a short-lived JWT access token using `JWT_ACCESS_SECRET` containing the user ID subject. Concurrently, it creates a random, cryptographically secure `refresh_token` using `secrets.token_urlsafe(64)`.
- **Database Index Mapping**: The SHA-256 hash of the refresh token is stored in the database. An index is declared on the `user_id` column inside the `refresh_tokens` model to ensure that cascading user deletions execute in sub-millisecond speeds.
- **Cookie Policy**: The raw refresh token is returned in a `Set-Cookie` header marked as `httpOnly` (prevents XSS leaks), `Secure` (requires HTTPS), and `SameSite=Lax` (blocks cross-site request forgery).

### 2. Multi-Request Token Refresh (Axios Interceptors)
- **Token Injection**: The Axios client request interceptor automatically attaches the Zustand-managed access token in the `Authorization: Bearer <token>` header of every outgoing call.
- **401 Interception**: When a request fails due to an expired access token (`HTTP 401`), the response interceptor catches the error.
- **Concurrent Request Queuing**: If multiple requests fail simultaneously, `isRefreshing` blocks additional refresh mutations. Instead, subsequent failed requests are returned as unresolved Promises and pushed into a `failedQueue` array.
- **Token Rotation**: The primary request issues a `POST /auth/refresh` sending the HTTP-Only cookie. The backend verifies the token hash in the DB, deletes the old row (revocation on rotation), persists a new refresh token, and returns a new access token.
- **Queue Flush**: The interceptor calls `processQueue(null, new_token)` to resolve all suspended Promises, updates their headers, and retries the original requests.

### 3. File Uploads Lifecycle
- **Size and Type Checks**: The FastAPI controller verifies the file size (rejects files $>20\text{MB}$) and ensures the MIME type is in the allowed whitelist (e.g., `application/pdf`, `application/json`).
- **OpenAI Streaming Upload**: `httpx.AsyncClient` streams the file binary payload using a multipart form encoder to `https://api.openai.com/v1/files` using the `purpose="assistants"` configuration.
- **Metadata Insertion**: Once OpenAI returns a unique `file_id` (e.g., `file-A9x2...`), the database service inserts a metadata record mapping this ID to the project, indexing `project_id` to prevent performance bottlenecks.

### 4. Server-Sent Events (SSE) Completions
- **Immediate User Log**: The user's query is committed to the database immediately so that the UI can retrieve it if the stream fails or is refreshed.
- **History Compilation**: The service queries all messages for the project ordered by `created_at ASC`, prepending the project's custom system prompt instructions as the `system` role roleplay context.
- **SSE Chunk Parsing**: The backend opens an asynchronous stream to the OpenRouter endpoint. As binary lines arrive, they are decoded, parsed for content choices deltas, and yielded back to the frontend formatted as `data: {"token": "chunk"}`.
- **Safe Client Disconnection (GeneratorExit)**: If the client cancels the request or closes their browser tab mid-response, Python raises a `GeneratorExit` exception inside the async generator loop. The service catches this exception, combines all token fragments collected up to that millisecond, writes the partial reply as an `assistant` message in the database, and terminates cleanly.
- **Background Tasks**: Once a stream finishes successfully, a thread-safe database session factory commits the completed assistant answer in the database.

### 5. API Protection (BOLA & Rate Limiting)
- **IDOR Check**: Every controller query checks project ownership (`project.user_id == current_user.id`) before executing databases mutations or spawning OpenRouter connections.
- **IP Rate Limiting**: Slowapi middleware tracks client IP addresses and enforces rate limit rules (e.g., maximum 5 login attempts per minute, 10 streaming chat requests per minute) returning a standard `HTTP 429` JSON response payload on abuse.
