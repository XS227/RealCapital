"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import type { FullDashboard } from "@/lib/adapter";

function fmtTs(ep: number) { return new Date(ep * 1000).toLocaleString(); }

function actionBadge(a: string) {
  if (a === "BUY")  return "badge-green";
  if (a === "SELL") return "badge-red";
  return "badge-gray";
}

function sourceBadge(s: string) {
  if (s === "ai")       return "badge-blue";
  if (s === "fallback") return "badge-gold";
  return "badge-gray";
}

export default function DecisionsPage() {
  const [data, setData] = useState<FullDashboard | null>(null);
  const [filter, setFilter] = useState<"all" | "BUY" | "SELL" | "HOLD">("all");

  useEffect(() => {
    async function load() {
      const r = await fetch("/api/admin/portfolio");
      if (r.status === 401) { window.location.href = "/admin/login"; return; }
      if (r.ok) setData(await r.json());
    }
    load();
  }, []);

  const all = data?.recentDecisions ?? [];
  const decisions = filter === "all" ? all : all.filter((d) => d.action === filter);

  return (
    <AdminShell>
      <div className="section-header">
        <div>
          <h1 className="page-title">AI Decision Log</h1>
          <p className="page-desc">Last 500 AI evaluations · {all.length} loaded</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {(["all", "BUY", "SELL", "HOLD"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`btn ${filter === f ? "btn-gold" : "btn-ghost"}`}
              style={{ padding: "6px 14px", fontSize: ".8rem" }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Missed opportunities ──────────────────────────────────────────── */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">Missed Opportunities</div>
          <span className="badge badge-gold">{data?.missedCandidates.length ?? 0}</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Token</th>
                <th>Rejected reason</th>
                <th>Max move</th>
                <th>Rejection correct?</th>
                <th>Times seen</th>
                <th>Started</th>
              </tr>
            </thead>
            <tbody>
              {(data?.missedCandidates ?? []).slice(0, 50).map((m, i) => (
                <tr key={i}>
                  <td><strong>{m.symbol}</strong></td>
                  <td className="text-cell">{m.primaryReason}</td>
                  <td className={m.maxMovePct > 10 ? "positive" : "neutral"}>
                    +{m.maxMovePct.toFixed(1)}%
                  </td>
                  <td>
                    <span className={`badge ${m.rejectionCorrect ? "badge-green" : "badge-red"}`}>
                      {m.rejectionCorrect ? "Yes" : "No — missed"}
                    </span>
                  </td>
                  <td>{m.rejectCount}×</td>
                  <td>{fmtTs(m.startedAt)}</td>
                </tr>
              ))}
              {!data?.missedCandidates.length && (
                <tr><td colSpan={6} className="empty-state">No missed candidates</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Decision log ──────────────────────────────────────────────────── */}
      <div className="section">
        <div className="section-title" style={{ marginBottom: 16 }}>Decision log</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Token</th>
                <th>Action</th>
                <th>Confidence</th>
                <th>Momentum</th>
                <th>Rug risk</th>
                <th>Quality</th>
                <th>Price</th>
                <th>Liquidity</th>
                <th>Source</th>
                <th>Reasoning</th>
              </tr>
            </thead>
            <tbody>
              {decisions.map((d, i) => (
                <tr key={i}>
                  <td>{fmtTs(d.ts)}</td>
                  <td><strong>{d.symbol}</strong></td>
                  <td><span className={`badge ${actionBadge(d.action)}`}>{d.action}</span></td>
                  <td>{(d.confidence * 100).toFixed(0)}%</td>
                  <td>{d.momentumScore}</td>
                  <td className={d.rugRiskScore > 30 ? "negative" : "positive"}>{d.rugRiskScore}</td>
                  <td>{d.entryQualityScore}</td>
                  <td>{d.priceTon > 0 ? d.priceTon.toExponential(3) : "—"}</td>
                  <td>{d.liquidityTon > 0 ? `${d.liquidityTon.toLocaleString()} TON` : "—"}</td>
                  <td><span className={`badge ${sourceBadge(d.source)}`}>{d.source}</span></td>
                  <td className="text-cell">{d.reasoning}</td>
                </tr>
              ))}
              {decisions.length === 0 && (
                <tr><td colSpan={11} className="empty-state">No decisions found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
