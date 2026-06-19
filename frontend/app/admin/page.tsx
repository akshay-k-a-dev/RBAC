"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { usersApi, rolesApi, User } from "@/lib/api";
import { Plus, Trash2, Settings, X, Check, Users, Shield, UserCheck, RefreshCw } from "lucide-react";

const ALL_PERMISSIONS = [
  "users:create",
  "users:delete",
  "users:view",
  "roles:assign",
  "permissions:view",
];

const ROLE_DEFAULTS: Record<string, string[]> = {
  admin: ["users:create", "users:delete", "users:view", "roles:assign", "permissions:view"],
  user: ["permissions:view"],
};

// ─── Add User Modal ───────────────────────────────────────────────────────────
function AddUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user" as "admin" | "user" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await usersApi.create(form);
      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="add-user-title">
        <div className="modal-header">
          <span className="modal-title" id="add-user-title">
            <Plus size={16} style={{ display: "inline", marginRight: 6, color: "var(--brand)" }} />
            Add New User
          </span>
          <button className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: "1rem" }}><span>⚠</span> {error}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }} noValidate>
          <div className="form-group">
            <label htmlFor="add-name">Full Name</label>
            <input id="add-name" type="text" placeholder="Jane Doe" value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required minLength={1} disabled={loading} />
          </div>
          <div className="form-group">
            <label htmlFor="add-email">Email Address</label>
            <input id="add-email" type="email" placeholder="jane@example.com" value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} required disabled={loading} />
          </div>
          <div className="form-group">
            <label htmlFor="add-password">Password</label>
            <input id="add-password" type="password" placeholder="Min. 6 characters" value={form.password}
              onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} disabled={loading} />
          </div>
          <div className="form-group">
            <label htmlFor="add-role">Role</label>
            <select id="add-role" value={form.role} onChange={(e) => setForm(f => ({ ...f, role: e.target.value as "admin" | "user" }))} disabled={loading}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
            <button id="add-user-submit-btn" type="submit" className="btn btn-primary" disabled={loading || !form.name || !form.email || !form.password}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <Plus size={16} />}
              {loading ? "Creating…" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Assign Role Modal ────────────────────────────────────────────────────────
function AssignRoleModal({ user: target, onClose, onAssigned }: { user: User; onClose: () => void; onAssigned: () => void }) {
  const [role, setRole] = useState<"admin" | "user">(target.role);
  const [perms, setPerms] = useState<string[]>(target.permissions);
  const [useDefault, setUseDefault] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // When role changes with useDefault, auto-update perms
  useEffect(() => {
    if (useDefault) setPerms(ROLE_DEFAULTS[role] || []);
  }, [role, useDefault]);

  function togglePerm(perm: string) {
    setUseDefault(false);
    setPerms(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await rolesApi.assign({ userId: target.id, role, permissions: useDefault ? undefined : perms });
      onAssigned();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to assign role");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 520 }} role="dialog" aria-modal="true" aria-labelledby="assign-role-title">
        <div className="modal-header">
          <span className="modal-title" id="assign-role-title">
            <Settings size={16} style={{ display: "inline", marginRight: 6, color: "var(--brand)" }} />
            Assign Role — {target.name}
          </span>
          <button className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: "1rem" }}><span>⚠</span> {error}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }} noValidate>
          <div className="form-group">
            <label htmlFor="assign-role-select">Role</label>
            <select id="assign-role-select" value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "user")} disabled={loading}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <label style={{ margin: 0 }}>Permissions</label>
              <button type="button" className="btn btn-ghost btn-sm"
                onClick={() => { setUseDefault(true); setPerms(ROLE_DEFAULTS[role] || []); }}>
                Reset to defaults
              </button>
            </div>
            <div className="perm-checkboxes">
              {ALL_PERMISSIONS.map((perm) => {
                const checked = perms.includes(perm);
                return (
                  <div key={perm} className={`perm-checkbox ${checked ? "checked" : ""}`}
                    onClick={() => togglePerm(perm)}
                    id={`perm-toggle-${perm.replace(":", "-")}`}
                    role="checkbox"
                    aria-checked={checked}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === " " && togglePerm(perm)}>
                    <div className="perm-checkbox-box">
                      {checked && <Check size={10} color="#fff" strokeWidth={3} />}
                    </div>
                    {perm}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
            <button id="assign-role-submit-btn" type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <Check size={16} />}
              {loading ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Confirm Delete Modal ─────────────────────────────────────────────────────
function ConfirmDeleteModal({ user: target, onClose, onDeleted }: { user: User; onClose: () => void; onDeleted: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setError("");
    setLoading(true);
    try {
      await usersApi.delete(target.id);
      onDeleted();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-confirm-title">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--danger-light)", border: "1px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Trash2 size={22} color="var(--danger)" />
          </div>
          <h3 id="delete-confirm-title" style={{ color: "var(--text-primary)" }}>Delete User</h3>
          <p>
            Are you sure you want to delete <strong style={{ color: "var(--text-primary)" }}>{target.name}</strong>?<br />
            <span style={{ fontSize: "0.8rem" }}>This action cannot be undone.</span>
          </p>

          {error && <div className="alert alert-error" style={{ width: "100%", textAlign: "left" }}><span>⚠</span> {error}</div>}

          <div style={{ display: "flex", gap: "0.75rem", width: "100%", justifyContent: "center" }}>
            <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
            <button id="delete-confirm-btn" className="btn btn-danger" onClick={handleDelete} disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <Trash2 size={15} />}
              {loading ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
export default function AdminPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [assignTarget, setAssignTarget] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await usersApi.list();
      setUsers(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  function flash(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3500);
  }

  const adminsCount = users.filter(u => u.role === "admin").length;
  const usersCount  = users.filter(u => u.role === "user").length;

  return (
    <>
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 className="page-title">User Management</h1>
            <p className="page-subtitle">Manage users, roles, and permissions</p>
          </div>
          <button id="open-add-user-modal-btn" className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Add User
          </button>
        </div>
      </div>

      <div className="page-content">
        {successMsg && (
          <div className="alert alert-success" style={{ marginBottom: "1rem" }} role="status">
            <Check size={16} /> {successMsg}
          </div>
        )}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
            <span>⚠</span> {error}
          </div>
        )}

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Users</div>
            <div className="stat-value">{users.length}</div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>accounts</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Admins</div>
            <div className="stat-value" style={{ color: "#a78bfa" }}>{adminsCount}</div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>with full access</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Regular Users</div>
            <div className="stat-value" style={{ color: "#60a5fa" }}>{usersCount}</div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>limited access</div>
          </div>
        </div>

        {/* Users table */}
        <div className="section-header">
          <h2 className="section-title">All Users</h2>
          <button id="refresh-users-btn" className="btn btn-ghost btn-sm" onClick={fetchUsers} disabled={loading} title="Refresh list">
            <RefreshCw size={14} style={loading ? { animation: "spin 1s linear infinite" } : {}} />
          </button>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
            <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3, borderTopColor: "var(--brand)" }} />
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <p>No users found. Add one to get started.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table aria-label="Users list">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Permissions</th>
                  <th>Joined</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isMe = u.id === currentUser?.id;
                  const initials = u.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

                  return (
                    <tr key={u.id} id={`user-row-${u.id}`}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: "50%",
                            background: u.role === "admin" ? "var(--brand)" : "var(--info)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "0.8rem", fontWeight: 700, color: "#fff", flexShrink: 0
                          }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                              {u.name} {isMe && <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>(you)</span>}
                            </div>
                            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${u.role}`}>{u.role}</span>
                      </td>
                      <td>
                        <div className="perms-cell">
                          {u.permissions.length === 0 ? (
                            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>None</span>
                          ) : (
                            u.permissions.map(p => <span key={p} className="badge badge-perm">{p}</span>)
                          )}
                        </div>
                      </td>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                        {new Date(u.createdAt ?? "").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                          <button
                            id={`assign-role-btn-${u.id}`}
                            className="btn btn-ghost btn-sm"
                            onClick={() => setAssignTarget(u)}
                            title="Assign role / permissions"
                          >
                            <Settings size={14} /> Role
                          </button>
                          <button
                            id={`delete-user-btn-${u.id}`}
                            className="btn btn-danger btn-sm"
                            onClick={() => setDeleteTarget(u)}
                            disabled={isMe}
                            title={isMe ? "Cannot delete your own account" : "Delete user"}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onCreated={() => { fetchUsers(); flash("User created successfully!"); }}
        />
      )}
      {assignTarget && (
        <AssignRoleModal
          user={assignTarget}
          onClose={() => setAssignTarget(null)}
          onAssigned={() => { fetchUsers(); flash(`Role updated for ${assignTarget.name}.`); }}
        />
      )}
      {deleteTarget && (
        <ConfirmDeleteModal
          user={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => { fetchUsers(); flash(`${deleteTarget.name} has been deleted.`); }}
        />
      )}
    </>
  );
}
