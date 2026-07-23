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