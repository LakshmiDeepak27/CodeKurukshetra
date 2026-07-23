# Code Kurukshetra

Competitive Coding & Code Review Platform.

## Production Setup & Prerequisites

Before deploying the judge engine on Linux, ensure the unprivileged sandbox user is created once on the host system:

```bash
sudo useradd --no-create-home --shell /usr/sbin/nologin ck-sandbox
```

> **Security Note**: The judge process fails closed (`_exit(2)`) if the `ck-sandbox` user is missing, preventing untrusted user submissions from executing under host process privileges.

## Development & Setup

1. **Database Migration & Seed**:
   ```bash
   cd backend
   npm run db:migrate
   npm run db:seed
   ```
2. **Backend Server**:
   ```bash
   cd backend
   npm run dev
   ```
3. **Frontend Application**:
   ```bash
   cd frontend/Editor
   npm run dev
   ```

## Judge0 Code Execution Engine

CodeKurukshetra supports two judging engines configured via `JUDGE_ENGINE` (`judge0` or `native`):

### 1. Judge0 (Default)

Judge0 is an open-source, self-hosted code execution engine running via Docker:

```bash
docker compose up -d
```

- **API Endpoint**: `http://localhost:2358`
- **Environment Variables** (`backend/.env` or `docker-compose.yml`):
  - `JUDGE_ENGINE="judge0"`
  - `JUDGE0_API_URL="http://localhost:2358"`
  - `JUDGE0_API_KEY=""` (optional)
- **Privileged Container Requirement**: The `judge0-worker` container requires `privileged: true` in `docker-compose.yml` to access cgroups and run Linux `isolate` sandboxing. It will not run unmodified in restricted CI runners or nested Docker environments without container privilege delegation.
- **Server Ceilings**: Ensure `MAX_CPU_TIME_LIMIT`, `MAX_WALL_TIME_LIMIT`, and `MAX_MEMORY_LIMIT` in `docker-compose.yml` are set generously enough to cover your largest problem limits, avoiding silent truncation by Judge0.

### 2. Native C++ Judge (Fallback)

If Docker or privileged containers are unavailable, set:
```bash
JUDGE_ENGINE="native"
```
The backend will automatically fall back to invoking the bundled C++ `/judge` binary (or `wsl.exe` on Windows).