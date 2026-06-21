"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import type { FullDashboard } from "@/lib/adapter";

function pnlClass(n: number) { return n > 0 ? "positive" : n < 0 ? "negative" : "neutral"; }
function pnlPfx(n: number)   { return n > 0 ? "+" : ""; }
function fmtTs(ep: number)   { return new Date(ep * 1000).toLocaleString(); }
function fmtAge(ms: number)  {
  const min = Math.floor((Date.now() - ms) / 60000);
  if (min < 60) return `${min}m ago`;
  return `${Math.floor(min / 60)}h ${min % 60}m ago`;
}

export default function AdminOverview() {
  const [data, setData] = useState<FullDashboard | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const r = await fetch("/api/admin/portfolio");
        if (r.status === 401) { window.location.href = "/admin/login"; return; }
        if (!r.ok) throw new Error();
        setData(await r.json());
      } catch { setErr("Failed to load data"); }
    }
    load();
    const iv = setInterval(load, 15_000);
    return () => clearInterval(iv);
  }, []);

  const d = data;
  const p = d?.portfolio;
  const a = d?.agentStatus;
  const prot = a?.protection;

  return (
    <AdminShell>
      <div className="section-header">
        <div>
          <h1 className="page-title">Overview</h1>
          <p className="page-desc">
            {d ? (
              <>
                Updated {fmtAge(d.updatedAt)}{" "}
                {d.isMock && <span className="badge badge-gold" style={{ marginLeft: 6 }}>Mock</span>}
                {!d.isMock && <span className="badge badge-green" style={{ marginLeft: 6 }}>Live</span>}
              </>
            ) : "Loading…"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {a && (
            <div className={`status-bar ${prot?.cpActive ? "protection" : a.paused ? "warn" : "ok"}`}>
              <span className={`live-dot ${prot?.cpActive ? "offline" : a.paused ? "warn" : ""}`} />
              {prot?.cpActive ? "Capital Protection" : a.paused ? "Paused" : "Running"}
            </div>
          )}
        </div>
      </div>

      {err && <div className="mock-banner">⚠ {err}</div>}

      {prot?.cpActive && (
        <div className="status-bar protection" style={{ marginBottom: 24 }}>
          🛡 Capital Protection Mode active since {prot.cpSince ? fmtTs(prot.cpSince) : "—"} ·{" "}
          Triggers: {prot.cpTriggers.join(" · ")}
        </div>
      )}

      {/* ── KPI cards ─────────────────────────────────────────────────────── */}
      <div className="stat-grid">
        {[
          { label: "Current Capital", value: p ? `${p.totalValueTon.toFixed(3)} TON` : "—", sub: `Start: ${p?.startingCapitalTon.toFixed(1)} TON`, cls: pnlClass(p?.roiPercent ?? 0) },
          { label: "Realized P&L",    value: p ? `${pnlPfx(p.realizedPnlTon)}${p.realizedPnlTon.toFixed(4)} TON` : "—", sub: "Closed trades", cls: pnlClass(p?.realizedPnlTon ?? 0) },
          { label: "Unrealized P&L",  value: p ? `${pnlPfx(p.unrealizedPnlTon)}${p.unrealizedPnlTon.toFixed(4)} TON` : "—", sub: "Open positions", cls: pnlClass(p?.unrealizedPnlTon ?? 0) },
          { label: "Total ROI",       value: p ? `${pnlPfx(p.roiPercent)}${p.roiPercent.toFixed(2)}%` : "—", sub: "Since inception", cls: pnlClass(p?.roiPercent ?? 0) },
          { label: "Win Rate",        value: p ? `${p.winRate.toFixed(1)}%` : "—", sub: `${p?.totalTrades ?? 0} total trades`, cls: pnlClass((p?.winRate ?? 50) - 50) },
          { label: "Max Drawdown",    value: p ? `${p.maxDrawdownPercent.toFixed(2)}%` : "—", sub: "From peak", cls: (p?.maxDrawdownPercent ?? 0) > 5 ? "negative" : "neutral" },
          { label: "Open Positions",  value: d ? String(d.openPositions.length) : "—", sub: "Active now", cls: "neutral" },
          { label: "Closed Trades",   value: p ? String(p.totalTrades) : "—", sub: "All time", cls: "neutral" },
          { label: "Peak Capital",    value: p ? `${p.peakValueTon.toFixed(3)} TON` : "—", sub: "Highest achieved", cls: "text-gold" },
        ].map((s) => (
          <div key={s.label} className="card card-sm">
            <div className="card-title">{s.label}</div>
            <div className={`card-value mono ${s.cls}`}>{s.value}</div>
            <div className="card-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Open positions ─────────────────────────────────────────────────── */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">Open Positions</div>
          <span className="badge badge-blue">{d?.openPositions.length ?? 0}</span>
        </div>
        {d?.openPositions.length === 0 ? (
          <div className="empty-state">No open positions</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Token</th><th>DEX</th><th>Entry</th><th>Size</th>
                  <th>P&L</th><th>P&L %</th><th>Age</th><th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {d?.openPositions.map((pos) => (
                  <tr key={pos.id}>
                    <td><strong>{pos.symbol}</strong></td>
                    <td>{pos.dex}</td>
                    <td>{pos.entryPriceTon.toExponential(3)}</td>
                    <td>{pos.costTon.toFixed(2)} TON</td>
                    <td className={pnlClass(pos.pnlTon)}>{pnlPfx(pos.pnlTon)}{pos.pnlTon.toFixed(4)}</td>
                    <td className={pnlClass(pos.pnlPercent)}>{pnlPfx(pos.pnlPercent)}{pos.pnlPercent.toFixed(2)}%</td>
                    <td>{pos.ageMinutes.toFixed(0)}m</td>
                    <td>{(pos.confidence * 100).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Recent closed trades (last 5) ─────────────────────────────────── */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">Recent Trades</div>
          <a href="/admin/trades" style={{ fontSize: ".8rem", color: "var(--gold)" }}>View all →</a>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Token</th><th>DEX</th><th>P&L TON</th><th>P&L %</th>
                <th>Hold</th><th>Exit reason</th><th>Confidence</th><th>Closed</th>
              </tr>
            </thead>
            <tbody>
              {(d?.closedTrades ?? []).slice(0, 5).map((t) => (
                <tr key={t.id}>
                  <td><strong>{t.symbol}</strong></td>
                  <td>{t.dex}</td>
                  <td className={pnlClass(t.pnlTon)}>{pnlPfx(t.pnlTon)}{t.pnlTon.toFixed(4)}</td>
                  <td className={pnlClass(t.pnlPercent)}>{pnlPfx(t.pnlPercent)}{t.pnlPercent.toFixed(2)}%</td>
                  <td>{t.holdMinutes.toFixed(0)}m</td>
                  <td><span className="badge badge-gray">{t.exitReason}</span></td>
                  <td>{(t.confidence * 100).toFixed(0)}%</td>
                  <td>{fmtTs(t.closedAt)}</td>
                </tr>
              ))}
              {!d?.closedTrades.length && (
                <tr><td colSpan={8} className="empty-state">No trades yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Agent status ───────────────────────────────────────────────────── */}
      <div className="section">
        <div className="section-title" style={{ marginBottom: 16 }}>Agent Status</div>
        <div className="card">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 16 }}>
            {[
              { label: "Mode",          value: a?.simulationMode ? "Paper Trading" : "Live" },
              { label: "Status",        value: a?.paused ? `Paused${a.pausedReason ? ` (${a.pausedReason})` : ""}` : "Running" },
              { label: "Protection",    value: prot?.mode ?? "—" },
              { label: "Daily stop",    value: prot?.dailyStop ? "Active" : "None" },
              { label: "Cooldown",      value: prot?.cooldownUntil ? fmtTs(prot.cooldownUntil) : "None" },
              { label: "Last activity", value: a?.lastActivityAt ? fmtAge(a.lastActivityAt) : "—" },
            ].map((r) => (
              <div key={r.label}>
                <div style={{ fontSize: ".7rem", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>{r.label}</div>
                <div style={{ fontSize: ".9rem", color: "var(--text-1)", fontFamily: "var(--font-mono)" }}>{r.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
