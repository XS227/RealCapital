"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import type { FullDashboard, ClosedTrade } from "@/lib/adapter";

function pnlClass(n: number) { return n > 0 ? "positive" : n < 0 ? "negative" : "neutral"; }
function pnlPfx(n: number)   { return n > 0 ? "+" : ""; }
function fmtTs(ep: number)   { return new Date(ep * 1000).toLocaleString(); }

function exitBadge(reason: string) {
  if (reason.includes("profit"))   return "badge-green";
  if (reason.includes("stop"))     return "badge-red";
  if (reason.includes("ai_sell"))  return "badge-blue";
  if (reason.includes("expir"))    return "badge-gold";
  return "badge-gray";
}

export default function TradesPage() {
  const [data, setData] = useState<FullDashboard | null>(null);
  const [filter, setFilter] = useState<"all" | "win" | "loss">("all");

  useEffect(() => {
    async function load() {
      const r = await fetch("/api/admin/portfolio");
      if (r.status === 401) { window.location.href = "/admin/login"; return; }
      if (r.ok) setData(await r.json());
    }
    load();
  }, []);

  const allTrades = data?.closedTrades ?? [];
  const trades: ClosedTrade[] =
    filter === "win" ? allTrades.filter((t) => t.pnlTon > 0)
    : filter === "loss" ? allTrades.filter((t) => t.pnlTon < 0)
    : allTrades;

  const totalPnl = allTrades.reduce((s, t) => s + t.pnlTon, 0);
  const wins = allTrades.filter((t) => t.pnlTon > 0).length;

  return (
    <AdminShell>
      <div className="section-header">
        <div>
          <h1 className="page-title">Trade History</h1>
          <p className="page-desc">All closed positions · {allTrades.length} total</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {(["all", "win", "loss"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`btn ${filter === f ? "btn-gold" : "btn-ghost"}`}
              style={{ padding: "6px 14px", fontSize: ".8rem" }}
            >
              {f === "all" ? "All" : f === "win" ? "Wins" : "Losses"}
            </button>
          ))}
        </div>
      </div>

      {/* Summary bar */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <div className="card card-sm" style={{ minWidth: 140 }}>
          <div className="card-title">Total P&L</div>
          <div className={`card-value mono ${pnlClass(totalPnl)}`} style={{ fontSize: "1.2rem" }}>
            {pnlPfx(totalPnl)}{totalPnl.toFixed(4)} TON
          </div>
        </div>
        <div className="card card-sm" style={{ minWidth: 140 }}>
          <div className="card-title">Win / Loss</div>
          <div className="card-value mono" style={{ fontSize: "1.2rem" }}>
            <span className="positive">{wins}</span>
            {" / "}
            <span className="negative">{allTrades.length - wins}</span>
          </div>
        </div>
        <div className="card card-sm" style={{ minWidth: 140 }}>
          <div className="card-title">Win Rate</div>
          <div className={`card-value mono ${pnlClass(wins / (allTrades.length || 1) * 100 - 50)}`} style={{ fontSize: "1.2rem" }}>
            {allTrades.length ? ((wins / allTrades.length) * 100).toFixed(1) : "—"}%
          </div>
        </div>
        <div className="card card-sm" style={{ minWidth: 140 }}>
          <div className="card-title">Avg Hold</div>
          <div className="card-value mono" style={{ fontSize: "1.2rem" }}>
            {allTrades.length
              ? (allTrades.reduce((s, t) => s + t.holdMinutes, 0) / allTrades.length).toFixed(0)
              : "—"}m
          </div>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Token</th>
              <th>DEX</th>
              <th>Entry price</th>
              <th>Exit price</th>
              <th>Size</th>
              <th>Proceeds</th>
              <th>P&L TON</th>
              <th>P&L %</th>
              <th>Hold</th>
              <th>Confidence</th>
              <th>Momentum</th>
              <th>Rug risk</th>
              <th>Exit reason</th>
              <th>Opened</th>
              <th>Closed</th>
              <th>Reasoning</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t, i) => (
              <tr key={t.id}>
                <td className="text-dim">{allTrades.length - i}</td>
                <td><strong>{t.symbol}</strong></td>
                <td>{t.dex}</td>
                <td>{t.entryPriceTon.toExponential(3)}</td>
                <td>{t.exitPriceTon.toExponential(3)}</td>
                <td>{t.costTon.toFixed(2)}</td>
                <td>{t.proceedsTon.toFixed(4)}</td>
                <td className={pnlClass(t.pnlTon)}>{pnlPfx(t.pnlTon)}{t.pnlTon.toFixed(4)}</td>
                <td className={pnlClass(t.pnlPercent)}>{pnlPfx(t.pnlPercent)}{t.pnlPercent.toFixed(2)}%</td>
                <td>{t.holdMinutes.toFixed(0)}m</td>
                <td>{(t.confidence * 100).toFixed(0)}%</td>
                <td>{t.momentumScore}</td>
                <td className={t.rugRiskScore > 30 ? "negative" : "positive"}>{t.rugRiskScore}</td>
                <td><span className={`badge ${exitBadge(t.exitReason)}`}>{t.exitReason}</span></td>
                <td>{fmtTs(t.openedAt)}</td>
                <td>{fmtTs(t.closedAt)}</td>
                <td className="text-cell">{t.reasoning}</td>
              </tr>
            ))}
            {trades.length === 0 && (
              <tr><td colSpan={17} className="empty-state">No trades found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
