"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/admin",           label: "Overview",   icon: "◈" },
  { href: "/admin/trades",    label: "Trades",     icon: "↕" },
  { href: "/admin/decisions", label: "Decisions",  icon: "🧠" },
  { href: "/admin/risk",      label: "Risk",       icon: "🛡" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <>
      <nav className="topnav">
        <div className="container">
          <div className="topnav-brand">
            <span className="brand-dot" />
            <Link href="/" style={{ color: "inherit" }}>REAL Capital</Link>
            <span style={{ color: "var(--text-3)", fontWeight: 400, fontSize: ".75rem", marginLeft: 4 }}>
              · Admin
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link href="/dashboard" style={{ fontSize: ".8rem", color: "var(--text-2)" }}>
              Public Dashboard
            </Link>
            <button onClick={logout} className="btn btn-ghost" style={{ fontSize: ".8rem", padding: "4px 10px" }}>
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-group">
            <div className="admin-sidebar-label">Navigation</div>
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={path === n.href ? "active" : ""}
              >
                <span>{n.icon}</span>
                {n.label}
              </Link>
            ))}
          </div>
          <div style={{ marginTop: 32 }} className="admin-sidebar-group">
            <div className="admin-sidebar-label">Links</div>
            <Link href="/">← Public site</Link>
            <Link href="/dashboard">Live dashboard</Link>
          </div>
        </aside>

        <main className="admin-main">{children}</main>
      </div>
    </>
  );
}
