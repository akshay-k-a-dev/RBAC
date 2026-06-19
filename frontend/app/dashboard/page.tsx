"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { meApi } from "@/lib/api";
import { ShieldCheck, User, Key, RefreshCw } from "lucide-react";

const PERM_DESCRIPTIONS: Record<string, string> = {
  "users:create": "Create new user accounts",
  "users:delete": "Delete user accounts",
  "users:view": "View all users list",
  "roles:assign": "Assign roles & permissions",
  "permissions:view": "View own permissions",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [livePerms, setLivePerms] = useState<{ role: string; permissions: string[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchPerms() {
    setLoading(true);
    setError("");
    try {
      const data = await meApi.permissions();
      setLivePerms(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load permissions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchPerms(); }, []);

  const role = livePerms?.role ?? user?.role ?? "user";
  const permissions = livePerms?.permissions ?? user?.permissions ?? [];

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">My Dashboard</h1>
        <p className="page-subtitle">Your profile and current permissions</p>
      </div>

      <div className="page-content">
        {error && (
          <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
            <span>⚠</span> {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
          {/* Profile card */}
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
              <div style={{
                width: 48, height: 48,
                background: "var(--brand)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "1.1rem",
                color: "#fff",
                boxShadow: "0 0 12px var(--brand-glow)",
                flexShrink: 0
              }}>
                {user?.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              <div>
                <h3 style={{ color: "var(--text-primary)", marginBottom: 0 }}>{user?.name}</h3>
                <span className={`badge badge-${role}`}>{role}</span>
              </div>
            </div>

            <div>
              <div className="info-row">
                <span className="info-label">Full Name</span>
                <span className="info-value">{user?.name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Email</span>
                <span className="info-value" style={{ fontSize: "0.85rem" }}>{user?.email}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Role</span>
                <span className={`badge badge-${role}`}>{role}</span>
              </div>
            </div>
          </div>

          {/* Permissions card */}
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Key size={16} color="var(--brand)" />
                <h3 style={{ color: "var(--text-primary)", margin: 0 }}>My Permissions</h3>
              </div>
              <button
                id="refresh-perms-btn"
                className="btn btn-ghost btn-sm"
                onClick={fetchPerms}
                disabled={loading}
                title="Refresh permissions"
                aria-label="Refresh permissions"
              >
                <RefreshCw size={14} className={loading ? "spin" : ""} style={loading ? { animation: "spin 1s linear infinite" } : {}} />
              </button>
            </div>

            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                <div className="spinner" style={{ borderTopColor: "var(--brand)" }} />
              </div>
            ) : permissions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🔒</div>
                <p>No permissions assigned</p>
              </div>
            ) : (
              <div className="perm-list">
                {permissions.map((perm) => (
                  <div key={perm} className="perm-item" id={`perm-${perm.replace(":", "-")}`}>
                    <div className="perm-dot" />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.8rem", color: "var(--text-primary)" }}>{perm}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                        {PERM_DESCRIPTIONS[perm] ?? "Custom permission"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick access for admin */}
        {user?.role === "admin" && (
          <div className="card" style={{ marginTop: "1.25rem", background: "var(--brand-light)", border: "1px solid rgba(124,58,237,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <ShieldCheck size={20} color="#a78bfa" />
              <div>
                <h4 style={{ color: "#a78bfa", marginBottom: "0.15rem" }}>Admin Access</h4>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  You have admin privileges.&nbsp;
                  <a href="/admin" style={{ color: "#a78bfa", fontWeight: 600 }}>
                    Go to User Management →
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
