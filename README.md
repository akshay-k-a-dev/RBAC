# RBAC User & Role Management System

A full-stack **Role-Based Access Control (RBAC)** system designed for security, scalability, and ease of deployment.

---

## 🛠 Tech Stack

- **Backend Framework**: [Moleculer.js](https://moleculer.services/) (Microservices architecture) + `moleculer-web` API gateway
- **Database ORM**: [Prisma](https://www.prisma.io/) (configured for Prisma Accelerate edge-caching and connection pooling)
- **Database**: PostgreSQL
- **Authentication**: Stateless JWT (JSON Web Tokens signed with HS256)
- **Frontend Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Frontend Styling**: Tailwind CSS
- **Language**: TypeScript (Frontend) / JavaScript (Backend)
- **Containerization**: Docker & Docker Compose

---

## ✨ Features

- **Microservices Backend**: Clean separation of concerns (Auth, Users, Roles, API Gateway) running in-process for high performance.
- **Granular RBAC Enforcement**: Role and permission validation applied as middleware hooks at the service level (Defense in Depth).
- **Stateless Authentication**: Fast, horizontally scalable auth using securely signed JWTs.
- **Admin Dashboard**: Next.js frontend to manage users, assign roles, and toggle specific permissions.
- **Self-Service Permissions**: Authenticated users can view their granted permissions in real-time.
- **Safety Guards**: Built-in protections against self-deletion, deleting the last admin, or demoting the last admin.
- **Prisma Accelerate Integration**: Ready for global edge deployments without connection pooling exhaustion.
- **Docker Ready**: Pre-configured multi-stage Dockerfiles for seamless server deployments.

---

## 🚀 Setup & Deployment

The system is designed to connect to a **remote PostgreSQL database** (e.g., Supabase, Neon, Railway) via a Prisma Accelerate connection string.

### Option 1: Docker Compose (Recommended for Servers)

This is the fastest way to get the system running locally or on a VPS.

**1. Clone the repo & setup env:**
```bash
git clone <your-repo-url>
cd rbac-system

# Setup Backend Environment
cp backend/.env.example backend/.env
# Edit backend/.env and add your DATABASE_URL and a random JWT_SECRET

# Setup Frontend Environment
cp frontend/.env.local.example frontend/.env.local
```

**2. Launch:**
```bash
docker compose up -d --build
```
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api

*(Note: The Docker containers start instantly without running database migrations or seeding. Ensure your database is migrated and seeded locally first before pointing the Docker containers to it).*

---

### Option 2: Manual Setup (Local Development)

**1. Database Migration & Seeding:**
You must run migrations and seed the initial admin user locally before starting the servers.

```bash
cd backend
npm install
cp .env.example .env  # Add DATABASE_URL & JWT_SECRET

# Generate Prisma client for Accelerate
npx prisma generate --no-engine

# Deploy schema to remote DB
npx prisma migrate deploy

# Seed the default admin user
npx ts-node prisma/seed.ts
```

**2. Start the Backend:**
```bash
# In the backend directory
npm run dev
```
Backend runs on `http://localhost:3001`.

**3. Start the Frontend:**
```bash
cd ../frontend
npm install
cp .env.local.example .env.local # Verify NEXT_PUBLIC_API_URL

npm run dev
```
Frontend runs on `http://localhost:3000`.

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | Prisma Accelerate connection string (`prisma+postgres://...`) |
| `JWT_SECRET` | ✅ | — | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | ❌ | `1h` | JWT expiry duration |
| `PORT` | ❌ | `3001` | API gateway port |
| `FRONTEND_URL` | ❌ | `http://localhost:3000` | Allowed CORS origin |

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001/api` | Backend API base URL |

---

## 📖 API Endpoints Reference

Base URL: `http://localhost:3001/api`  
Protected endpoints require: `Authorization: Bearer <token>`

### Auth
- `POST /auth/login` (Public)
  - **Body**: `{ "email": "...", "password": "..." }`
  - **Returns**: `{ "token": "...", "user": { ... } }`

### Users
- `POST /users` (Requires: `users:create`)
  - **Body**: `{ "name": "...", "email": "...", "password": "...", "role": "user" }`
- `GET /users` (Requires: `users:view`)
  - **Returns**: Array of user objects.
- `DELETE /users/:id` (Requires: `users:delete`)
  - **Returns**: `{ "success": true }`

### Roles & Permissions
- `POST /roles/assign` (Requires: `roles:assign`)
  - **Body**: `{ "userId": "uuid", "role": "admin", "permissions": ["users:create"] }`
  - *Note: `permissions` array is optional. If omitted, default role permissions are applied.*
- `GET /me/permissions` (Authenticated Users)
  - **Returns**: `{ "role": "user", "permissions": ["..."] }`

---

## 🏛 Architecture & RBAC Model

### Roles & Default Permissions

| Role | Default Permissions |
|---|---|
| `admin` | `users:create`, `users:delete`, `users:view`, `roles:assign`, `permissions:view` |
| `user` | `permissions:view` |

### Security Layers (Defense in Depth)

1. **Backend API Gateway**: Validates JWT signature and expiry.
2. **Moleculer Action Hooks**: `auth.mixin.js` enforces `requirePermission` directly on the service action. Cannot be bypassed by calling endpoints directly.
3. **Frontend Layout Guards**: Next.js middleware/layouts redirect unauthorized users away from protected routes.
4. **Database Constraints**: Prevents self-deletion or removing the last remaining admin account.

### Edge Cases Handled

- **Authentication**: Generic `401` errors for bad credentials (prevents user enumeration).
- **Token Tampering**: Immediate rejection of unsigned or expired JWTs.
- **Last Admin Guard**: The system will block (`400 Bad Request`) any attempt to delete or demote the very last admin in the database.
