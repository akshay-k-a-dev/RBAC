"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Shield, LayoutDashboard, Users, LogOut, ShieldCheck } from "lucide-react";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const navItems = [
    { href: "/dashboard", icon: <LayoutDashboard size={16} />, label: "My Dashboard" },
    ...(user.role === "admin"
      ? [{ href: "/admin", icon: <Users size={16} />, label: "User Management" }]
      : []),
  ];

  return (
    <nav className="sidebar" aria-label="Sidebar navigation">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Shield size={18} color="#fff" />
        </div>
        RBAC Manager
      </div>

      <div className="sidebar-nav">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-link ${pathname.startsWith(item.href) ? "active" : ""}`}
            id={`nav-${item.href.replace("/", "")}`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </div>

      <div className="sidebar-spacer" />

      <div className="sidebar-user">
        <div className="sidebar-avatar" aria-hidden="true">{initials}</div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name" title={user.name}>{user.name}</div>
          <div className="sidebar-user-role">{user.role}</div>
        </div>
        <button
          id="logout-btn"
          className="btn btn-ghost btn-sm"
          style={{ padding: "0.35rem", flexShrink: 0 }}
          onClick={logout}
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut size={15} />
        </button>
      </div>
    </nav>
  );
}
