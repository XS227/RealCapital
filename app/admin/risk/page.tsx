"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import type { FullDashboard } from "@/lib/adapter";

function fmtTs(ep: number) { return new Date(ep * 1000).toLocaleString(); }

export default function RiskPage() {
  const [data, setData] = useState<FullDashboard | null>(null);

  useEffect(() => {
    async function load() {
      const r = await fetch("/api/admin/portfolio");
      if (r.status === 401) { window.location.href = "/admin/login"; return; }
      if (r.ok) setData(await r.json());
    }
    load();
    const iv = setInterval(load, 20_000);
    return () => clearInterval(iv);
  }, []);

  const prot = data?.agentStatus.protection;
  const blocked = data?.blockedExits ?? [];

  return (
    <AdminShell>
      <div className="section-header">
        <div>
          <h1 className="page-title">Risk &amp; Protection</h1>
          <p className="page-desc">Capital protection events, blocked exits, and risk parameters</p>
        </div>
        {prot && (
          <div className={`status-bar ${prot.cpActive ? "protection" : "ok"}`}>
            <span className={`live-dot ${prot.cpActive ? "offline" : ""}`} />
            {prot.mode}
          </div>
        )}
      </div>

      {/* ── Protection status ─────────────────────────────────────────────── */}
      <div className="section">
        <div className="section-title" style={{ marginBottom: 16 }}>Protection Status</div>
        {prot?.cpActive ? (
          <div className="status-bar protection" style={{ marginBottom: 20 }}>
            🛡 Capital Protection active since {prot.cpSince ? fmtTs(prot.cpSince) : "—"}
          </div>
        ) : (
          <div className="status-bar ok" style={{ marginBottom: 20 }}>
            ✓ Normal operation — no active protection events
          </div>
        )}

        <div className="card">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
            <div>
              <div style={{ fontSize: ".7rem", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>Mode</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "1rem", color: prot?.cpActive ? "var(--red)" : "var(--green)" }}>
                {prot?.mode ?? "—"}
              </div>
            </div>
            <div>
              <div style={{ fontSize: ".7rem", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>Daily Stop</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "1rem", color: prot?.dailyStop ? "var(--red)" : "var(--text-2)" }}>
                {prot?.dailyStop ? `Active — ${prot.dailyStopReason}` : "None"}
              </div>
            </div>
            <div>
              <div style={{ fontSize: ".7rem", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>Cooldown Until</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "1rem", color: prot?.cooldownUntil ? "var(--amber)" : "var(--text-2)" }}>
                {prot?.cooldownUntil ? fmtTs(prot.cooldownUntil) : "None"}
              </div>
            </div>
            <div>
              <div style={{ fontSize: ".7rem", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>Cooldown Reason</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "1rem", color: "var(--text-2)" }}>
                {prot?.cooldownReason ?? "—"}
              </div>
            </div>
          </div>

          {prot?.cpTriggers.length ? (
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
              <div style={{ fontSize: ".7rem", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>CP Triggers</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {prot.cpTriggers.map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: ".85rem", color: "var(--red)" }}>
                    <span>▸</span> {t}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Blocked exits ─────────────────────────────────────────────────── */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">Blocked Exits</div>
          <span className="badge badge-gold">{blocked.length}</span>
        </div>
        <p className="section-sub" style={{ marginBottom: 16 }}>
          Positions where the AI wanted to exit early but the minimum hold-time guard blocked it.
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Token</th>
                <th>Position</th>
                <th>Age</th>
                <th>Block reason</th>
                <th>Exit confidence</th>
                <th>Rug risk</th>
                <th>AI reasoning</th>
              </tr>
            </thead>
            <tbody>
              {blocked.map((b, i) => (
                <tr key={i}>
                  <td>{fmtTs(b.ts)}</td>
                  <td><strong>{b.symbol}</strong></td>
                  <td className="text-dim">{b.positionId.slice(0, 8)}</td>
                  <td>{b.ageMinutes.toFixed(1)}m</td>
                  <td>{b.reason}</td>
                  <td>{(b.exitConfidence * 100).toFixed(0)}%</td>
                  <td className={b.rugRiskScore > 30 ? "negative" : "positive"}>{b.rugRiskScore}</td>
                  <td className="text-cell">{b.aiReasoning}</td>
                </tr>
              ))}
              {blocked.length === 0 && (
                <tr><td colSpan={8} className="empty-state">No blocked exits</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Risk parameters ────────────────────────────────────────────────── */}
      <div className="section">
        <div className="section-title" style={{ marginBottom: 16 }}>Live Risk Parameters</div>
        <p style={{ fontSize: ".8rem", color: "var(--text-3)", marginBottom: 16 }}>
          Read directly from agent configuration. These parameters govern every entry and exit decision.
        </p>
        <div className="card">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))", gap: 0 }}>
            {[
              ["Stop Loss", "12%", "Hard exit if position loses this much"],
              ["Take Profit", "25%", "Auto-exit on this gain"],
              ["Trailing Activate", "8%", "Trailing stop activates at this profit"],
              ["Trailing Distance", "5%", "Trailing stop distance from peak"],
              ["Max Position Size", "20%", "Of total portfolio per trade"],
              ["Max Open Positions", "3", "Simultaneous positions"],
              ["Min Confidence", "0.70", "AI confidence threshold for entry"],
              ["Min Liquidity", "2,000 TON", "Pool floor requirement"],
              ["Max Rug Risk", "35 / 100", "Entry blocked above this score"],
              ["Max Daily Loss", "15%", "Portfolio loss triggers daily stop"],
              ["Buy Cooldown", "10 min", "Minimum time between entries"],
              ["Min Hold Time", "20 min", "Blocks premature exits"],
            ].map(([label, value, desc]) => (
              <div
                key={label}
                style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 4 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: ".85rem", color: "var(--text-2)" }}>{label}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: ".9rem", fontWeight: 700, color: "var(--text-1)" }}>{value}</span>
                </div>
                <div style={{ fontSize: ".75rem", color: "var(--text-3)" }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
