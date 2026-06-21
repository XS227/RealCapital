"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface PubStatus {
  portfolio: {
    totalValueTon: number;
    roiPercent: number;
    realizedPnlTon: number;
    maxDrawdownPercent: number;
    totalTrades: number;
    winRate: number;
  };
  agentStatus: { running: boolean; paused: boolean; protectionMode: string };
  openPositionCount: number;
  isMock: boolean;
  updatedAt: number;
}

function pnlClass(n: number) {
  return n > 0 ? "positive" : n < 0 ? "negative" : "neutral";
}

function pnlPrefix(n: number) {
  return n > 0 ? "+" : "";
}

export default function DashboardPage() {
  const [data, setData] = useState<PubStatus | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const r = await fetch("/api/status");
        if (!r.ok) throw new Error();
        setData(await r.json());
      } catch {
        setError(true);
      }
    }
    load();
    const iv = setInterval(load, 10_000);
    return () => clearInterval(iv);
  }, []);

  const s = data;
  const prot = s?.agentStatus.protectionMode;
  const isProtection = prot && prot !== "NORMAL";

  return (
    <>
      <nav className="topnav">
        <div className="container">
          <div className="topnav-brand">
            <span className="brand-dot" />
            <Link href="/" style={{ color: "inherit" }}>REAL Capital</Link>
          </div>
          <ul className="topnav-links">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/dashboard" className="active">Dashboard</Link></li>
          </ul>
        </div>
      </nav>

      <div style={{ padding: "40px 0" }}>
        <div className="container">
          {/* Header */}
          <div className="page-header">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h1 className="page-title">Live Treasury Dashboard</h1>
                <p className="page-desc">TON Momentum Hunter · Paper simulation · Read-only</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                {s && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: ".8rem", color: "var(--text-2)" }}>
                    <span className={`live-dot ${s.agentStatus.paused ? "warn" : "online"}`} />
                    {s.agentStatus.paused ? "Paused" : "Running"}
                  </div>
                )}
                {s?.isMock && <span className="badge badge-gold">Mock Data</span>}
                {s && !s.isMock && <span className="badge badge-green">Live Data</span>}
              </div>
            </div>
          </div>

          {error && (
            <div className="mock-banner">⚠ Could not reach agent — showing last known state</div>
          )}

          {isProtection && (
            <div className="status-bar protection" style={{ marginBottom: 24 }}>
              🛡 Capital Protection Active — new entries paused ({prot})
            </div>
          )}

          {s?.isMock && (
            <div className="mock-banner">
              ⚠ Mock data — connect MEMORY_JSON_PATH to enable live feed
            </div>
          )}

          {/* Stats */}
          <div className="stat-grid">
            <div className="card card-sm">
              <div className="card-title">Total Capital</div>
              <div className={`card-value mono ${pnlClass(s?.portfolio.roiPercent ?? 0)}`}>
                {s ? `${s.portfolio.totalValueTon.toFixed(3)} TON` : "—"}
              </div>
              <div className="card-sub">Starting: 15.000 TON</div>
            </div>

            <div className="card card-sm">
              <div className="card-title">Total ROI</div>
              <div className={`card-value mono ${pnlClass(s?.portfolio.roiPercent ?? 0)}`}>
                {s ? `${pnlPrefix(s.portfolio.roiPercent)}${s.portfolio.roiPercent.toFixed(2)}%` : "—"}
              </div>
              <div className="card-sub">Since inception</div>
            </div>

            <div className="card card-sm">
              <div className="card-title">Realized P&amp;L</div>
              <div className={`card-value mono ${pnlClass(s?.portfolio.realizedPnlTon ?? 0)}`}>
                {s ? `${pnlPrefix(s.portfolio.realizedPnlTon)}${s.portfolio.realizedPnlTon.toFixed(4)} TON` : "—"}
              </div>
              <div className="card-sub">Closed positions</div>
            </div>

            <div className="card card-sm">
              <div className="card-title">Max Drawdown</div>
              <div className={`card-value mono ${(s?.portfolio.maxDrawdownPercent ?? 0) > 5 ? "negative" : "neutral"}`}>
                {s ? `${s.portfolio.maxDrawdownPercent.toFixed(2)}%` : "—"}
              </div>
              <div className="card-sub">From peak capital</div>
            </div>

            <div className="card card-sm">
              <div className="card-title">Win Rate</div>
              <div className={`card-value mono ${pnlClass((s?.portfolio.winRate ?? 50) - 50)}`}>
                {s ? `${s.portfolio.winRate.toFixed(1)}%` : "—"}
              </div>
              <div className="card-sub">{s?.portfolio.totalTrades ?? 0} closed trades</div>
            </div>

            <div className="card card-sm">
              <div className="card-title">Open Positions</div>
              <div className="card-value mono">
                {s ? s.openPositionCount : "—"}
              </div>
              <div className="card-sub">Active right now</div>
            </div>
          </div>

          {/* Info section */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 8 }}>
            <div className="card">
              <div className="card-title">About this system</div>
              <p style={{ fontSize: ".875rem", color: "var(--text-2)", lineHeight: 1.75, marginTop: 8 }}>
                TON Momentum Hunter is an autonomous AI trading agent that scans DeDust and StonFi
                for momentum opportunities. Every decision is made by Claude AI with full reasoning
                and confidence scoring. This dashboard is read-only — the agent runs independently.
              </p>
            </div>
            <div className="card">
              <div className="card-title">Full analytics access</div>
              <p style={{ fontSize: ".875rem", color: "var(--text-2)", lineHeight: 1.75, marginTop: 8, marginBottom: 16 }}>
                The admin dashboard provides complete trade history, AI decision audit log,
                missed opportunity analysis, risk event timeline, and capital protection history.
              </p>
              <Link href="/admin" className="btn btn-outline" style={{ fontSize: ".8rem", padding: "8px 16px" }}>
                Admin Dashboard →
              </Link>
            </div>
          </div>

          {/* Disclaimer */}
          <div style={{ marginTop: 40, padding: "16px 20px", background: "var(--bg-1)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: ".75rem", color: "var(--text-3)" }}>
            Experimental AI trading system. Paper simulation only. Historical performance is not a guarantee of future results. Not financial advice.
          </div>
        </div>
      </div>

      <footer className="footer">
        <div className="container">
          <div className="footer-inner">
            <div className="footer-brand">REAL Capital</div>
            <div className="footer-copy">Paper Trading Simulation · © SETAEI</div>
          </div>
        </div>
      </footer>
    </>
  );
}
