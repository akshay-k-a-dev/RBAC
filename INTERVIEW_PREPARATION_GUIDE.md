# RBAC Project Interview Preparation Guide

## 1) 60-Second Project Pitch
This project is a full-stack Role-Based Access Control (RBAC) system built with a microservices-style Moleculer backend and a Next.js frontend. It supports secure JWT authentication, user management, role assignment, and fine-grained permission control. The backend enforces authorization at service-hook level (not just route level), while the frontend provides guarded routes and role-aware UI. The system includes safety checks like preventing self-deletion and blocking deletion/demotion of the last admin.

---

## 2) What Problem This Solves
- Centralized user and role management
- Fine-grained action-level authorization
- Scalable stateless authentication for modern web apps
- Secure admin workflows with guardrails against dangerous operations

---

## 3) High-Level Architecture

### Backend
- **Framework:** Moleculer (`backend/index.js`, `backend/services/*.js`)
- **Gateway:** `moleculer-web` (`backend/services/api.service.js`)
- **Data Layer:** Prisma + PostgreSQL + Prisma Accelerate (`backend/prisma.js`)
- **Auth Layer:** Reusable JWT/permission mixin (`backend/mixins/auth.mixin.js`)

### Frontend
- **Framework:** Next.js App Router (`frontend/app/*`)
- **State/Auth Context:** `frontend/context/AuthContext.tsx`
- **API Client:** `frontend/lib/api.ts`
- **Role-based UI Pages:** `/admin`, `/dashboard`, `/login`

---

## 4) Core RBAC Model

### Roles
- `admin`
- `user`

### Permissions
- `users:create`
- `users:delete`
- `users:view`
- `roles:assign`
- `permissions:view`

### Defaults (`backend/roles.js`)
- `admin` gets all permissions above
- `user` gets only `permissions:view`

---

## 5) Request Lifecycle (End-to-End)
1. Frontend calls API via `frontend/lib/api.ts`.
2. The Authorization header with the JWT is attached automatically for protected calls.
3. API gateway (`api.service.js`) extracts token into `ctx.meta.token`.
4. Service hooks call `verifyToken` (from `auth.mixin.js`).
5. Permission hooks (`requirePermission`) enforce action-level RBAC.
6. Service action performs Prisma DB operation.
7. Errors are normalized by API gateway `onError` into `{ error: string }`.
8. Frontend shows response or mapped error.

---

## 6) Authentication & Authorization Design

### Authentication
- Login endpoint: `POST /api/auth/login`
- Password hashing with `bcryptjs` (compare on login)
- JWT includes user id, role, and permissions
- Stateless auth enables horizontal scaling

### Authorization
- Enforced in service hooks (defense in depth)
- Examples:
  - `users.create` needs `users:create`
  - `users.list` needs `users:view`
  - `roles.assign` needs `roles:assign`

### Why this is strong in interviews
- Permission checks are not only UI-based and not only route-based
- Checks run in backend business layer before action execution

---

## 7) Security Controls You Should Highlight
- Generic login error message to reduce user enumeration risk
- JWT signature + expiry validation
- Permission checks for all sensitive actions
- Self-deletion blocked
- Last-admin deletion blocked
- Last-admin demotion blocked
- CORS allowlist configured at gateway
- Passwords stored as bcrypt hashes (`passwordHash`)

---

## 8) Database Design (Prisma)

### `User` model (`backend/prisma/schema.prisma`)
- `id` (UUID)
- `name`
- `email` (unique)
- `passwordHash`
- `role` (enum: admin/user)
- `permissions` (string array)
- `createdAt`, `updatedAt`

### Trade-off to mention
- Permissions are duplicated in JWT and DB.
  - JWT copy improves performance for authorization checks.
  - DB is still source of truth for current permissions.
  - `GET /me/permissions` reads live DB to reflect mid-session changes.

---

## 9) API Contracts You Must Remember

### Auth
- `POST /api/auth/login`
  - body: `{ email, password }`
  - returns: `{ token, user }`

### Users
- `POST /api/users` (admin permission)
- `GET /api/users` (admin permission)
- `DELETE /api/users/:id` (admin permission + safety guards)

### Roles
- `POST /api/roles/assign`
  - body: `{ userId, role, permissions? }`
  - if `permissions` omitted, role defaults are applied

### Me
- `GET /api/me/permissions`
  - returns live role + permissions from DB

---

## 10) Frontend Flow You Can Explain
- `AuthProvider` restores token from localStorage and decodes JWT payload for session restore.
- `/` route redirects based on auth + role:
  - no user -> `/login`
  - admin -> `/admin`
  - user -> `/dashboard`
- Layout guards:
  - `admin/layout.tsx` blocks non-admins
  - `dashboard/layout.tsx` blocks unauthenticated users
- Admin page supports:
  - add user
  - assign role/permissions
  - delete user
- Dashboard shows current profile + live permissions.

---

## 11) Key Engineering Decisions & Rationale
- **Moleculer services** for modular backend boundaries.
- **Auth mixin reuse** to avoid duplicated auth logic.
- **Prisma ORM** for type-safe DB interactions and migration flow.
- **JWT stateless auth** to avoid session store complexity.
- **Defense in depth**: gateway token extraction + service-level permission checks + UI guards.

---

## 12) Known Trade-offs / Improvement Ideas
- Token stored in localStorage (with in-memory copy): simple, but less secure than httpOnly cookies.
- No refresh-token flow yet.
- No automated test suite currently present.
- Permission list is currently static in code (`roles.js`), could evolve into DB-driven policy.
- Could add audit logs for critical admin actions.
- Could add rate limiting and login lockout for brute-force resistance.

---

## 13) Likely Interview Questions with Strong Answers

### Q1: Why use RBAC here instead of only checking `isAdmin`?
**Answer:** RBAC gives fine-grained authorization by action. It allows controlled delegation and scales better when roles evolve beyond just admin/user.

### Q2: Where is authorization enforced?
**Answer:** In backend Moleculer action hooks via `verifyToken` and `requirePermission`, so it cannot be bypassed by manipulating frontend UI.

### Q3: How do you prevent privilege-related destructive mistakes?
**Answer:** The system blocks self-deletion, deleting the last admin, and demoting the last admin. These rules are enforced server-side.

### Q4: How do you handle changed permissions for already-logged-in users?
**Answer:** JWT has a snapshot, but `GET /me/permissions` reads the DB live so users can fetch updated permissions without re-login.

### Q5: What security weaknesses remain?
**Answer:** localStorage token persistence is vulnerable to XSS exfiltration. A better design is httpOnly secure cookies with CSRF strategy and refresh-token rotation.

### Q6: Why Moleculer for this size project?
**Answer:** It provides clear service boundaries and easy progression toward distributed deployment while still running in-process for simplicity now.

### Q7: How would you scale this system?
**Answer:** Enable transporter (NATS), run multiple service instances, keep JWT stateless auth, externalize config/secrets, and add centralized observability.

### Q8: How do you validate input?
**Answer:** Moleculer action `params` schemas validate request payloads before handlers execute.

### Q9: What happens on invalid permissions in role assignment?
**Answer:** The backend validates against `ALL_PERMISSIONS` and rejects invalid entries with `400 BAD_REQUEST`.

### Q10: How is error consistency maintained?
**Answer:** API gateway has centralized `onError` that formats all errors into a consistent `{ error: string }` response contract.

---

## 14) Pre-Interview Revision Checklist
- Explain architecture in under 2 minutes.
- Memorize all endpoints and required permissions.
- Be ready to discuss defense in depth and safety guards.
- Be ready to justify JWT + RBAC design choices.
- Prepare at least 3 improvement ideas (cookies, refresh tokens, tests/audit logs).
- Walk through one full user flow:
  - admin login -> add user -> assign role -> user checks `/me/permissions`.

---

## 15) 30-Second Closing Line for Interview
“This project demonstrates secure role-based authorization across the full stack, with clear backend enforcement, practical admin workflows, and production-focused guardrails. I focused on making authorization explicit, reusable, and difficult to bypass while keeping the architecture simple enough to evolve into a distributed setup.”
