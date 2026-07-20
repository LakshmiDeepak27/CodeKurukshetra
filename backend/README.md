# Code Kurukshetra API

This backend provides authentication, problems, submission history, and the local judge integration for Code Kurukshetra.

## Prerequisites

- Node.js 20+
- MySQL 8+
- WSL and the compiled `judge` binary for local code execution on Windows

## Setup

```powershell
cd E:\Projects\CodeKurukshetra\backend
Copy-Item .env.example .env
# Edit .env with your MySQL credentials and a strong AUTH_TOKEN_SECRET.
npm install
npm run db:setup
npm run db:import-legacy-users  # optional: moves accounts from data/users.json
npm run dev
```

The API starts at `http://localhost:3000`.

## Endpoints

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/health` | API and database status |
| POST | `/auth/signup` | Create a password account |
| POST | `/auth/signin` | Get a session token |
| POST | `/auth/google` | Exchange a verified Google credential |
| GET | `/auth/me` | Current user (Bearer token required) |
| GET | `/problems` | List active problems |
| GET | `/problems/:id` | Problem detail |
| GET | `/problems/:id/testcases` | Public sample test cases |
| POST | `/submissions` | Run or submit code; authentication is optional |
| GET | `/submissions/me` | Current user's submission history |
| GET | `/submissions/:id` | One submission and its visible results |

`POST /submit` remains available for the existing editor frontend.

## Production note

The bundled judge executes untrusted programs locally. Deploy it only inside a properly sandboxed runner with CPU, memory, network, filesystem, and process limits. The current WSL runner is suitable for development, not public production traffic.
