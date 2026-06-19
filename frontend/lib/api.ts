const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  permissions: string[];
  createdAt?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface ApiError {
  error: string;
}

// ─── Token storage ────────────────────────────────────────────────────────────
// Stored in memory for XSS protection. A server-side httpOnly cookie approach
// would be more secure but requires a Next.js API route proxy. localStorage
// is used as a backup for page refreshes — see README for the tradeoff.
let memoryToken: string | null = null;

export function setToken(token: string) {
  memoryToken = token;
  if (typeof window !== "undefined") {
    localStorage.setItem("rbac_token", token);
  }
}

export function getToken(): string | null {
  if (memoryToken) return memoryToken;
  if (typeof window !== "undefined") {
    return localStorage.getItem("rbac_token");
  }
  return null;
}

export function clearToken() {
  memoryToken = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem("rbac_token");
  }
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
async function request<T>(
  path: string,
  options: RequestInit = {},
  withAuth = true
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (withAuth) {
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({ error: "Empty response" }));

  if (!res.ok) {
    const err = (data as ApiError).error || "Request failed";
    throw new Error(err);
  }

  return data as T;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }, false),
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersApi = {
  list: () => request<User[]>("/users"),

  create: (data: { name: string; email: string; password: string; role?: "admin" | "user" }) =>
    request<User>("/users", { method: "POST", body: JSON.stringify(data) }),

  delete: (id: string) =>
    request<{ success: boolean }>(`/users/${id}`, { method: "DELETE" }),
};

// ─── Roles ────────────────────────────────────────────────────────────────────
export const rolesApi = {
  assign: (data: { userId: string; role: "admin" | "user"; permissions?: string[] }) =>
    request<{ success: boolean }>("/roles/assign", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ─── Me ───────────────────────────────────────────────────────────────────────
export const meApi = {
  permissions: () =>
    request<{ role: string; permissions: string[] }>("/me/permissions"),
};
