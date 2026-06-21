"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import type { FullDashboard, ClosedTrade } from "@/lib/adapter";
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  Cell, Legend,
} from "recharts";

const GREEN = "#22c55e";
const RED   = "#ef4444";
const GOLD  = "#c9a84c";
const MUTED = "rgba(255,255,255,0.08)";
const TEXT3 = "rgba(255,255,255,0.35)";

function buildEquityCurve(trades: ClosedTrade[], start: number) {
  let v = start;
  const pts = [{ label: "Start", value: Number(start.toFixed(4)) }];
  trades.forEach((t, i) => {
    v += t.pnlTon;
    pts.push({ label: t.symbol || `#${i + 1}`, value: Number(v.toFixed(4)) });
  });
  return pts;
}

function buildPnlBars(trades: ClosedTrade[]) {
  return trades.map((t, i) => ({
    label: t.symbol || `#${i + 1}`,
    pnl:    Number(t.pnlTon.toFixed(4)),
    pnlPct: Number(t.pnlPercent.toFixed(2)),
    exit:   t.exitReason.replace(/^EXIT_THESIS_/, "").replace(/_/g, " "),
  }));
}

function buildHoldBuckets(trades: ClosedTrade[]) {
  const b: Record<string, number> = { "<10m": 0, "10–20m": 0, "20–30m": 0, "30–60m": 0, ">60m": 0 };
  trades.forEach((t) => {
    const m = t.holdMinutes;
    if (m < 10)      b["<10m"]++;
    else if (m < 20) b["10–20m"]++;
    else if (m < 30) b["20–30m"]++;
    else if (m < 60) b["30–60m"]++;
    else             b[">60m"]++;
  });
  return Object.entries(b).map(([label, count]) => ({ label, count }));
}

function EquityTip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "8px 12px", borderRadius: 6, fontSize: ".78rem" }}>
      <div style={{ color: GOLD, fontWeight: 600 }}>{d.label}</div>
      <div style={{ color: "var(--text-1)" }}>{d.value.toFixed(4)} TON</div>
    </div>
  );
}

function PnlTip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "8px 12px", borderRadius: 6, fontSize: ".78rem" }}>
      <div style={{ color: GOLD, fontWeight: 600 }}>{d.label}</div>
      <div style={{ color: d.pnl >= 0 ? GREEN : RED }}>
        {d.pnl >= 0 ? "+" : ""}{d.pnl.toFixed(4)} TON ({d.pnlPct}%)
      </div>
      <div style={{ color: TEXT3, marginTop: 2 }}>{d.exit}</div>
    </div>
  );
}

const TIP_STYLE = {
  contentStyle: { background: "var(--bg-card)", border: "1px solid var(--border)", fontSize: ".78rem" },
  labelStyle:   { color: GOLD },
  itemStyle:    { color: "var(--text-1)" },
};

export default function AnalyticsPage() {
  const [data, setData] = useState<FullDashboard | null>(null);
  const [err,  setErr]  = useState("");

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
    const iv = setInterval(load, 30_000);
    return () => clearInterval(iv);
  }, []);

  const trades = data?.closedTrades ?? [];
  const p      = data?.portfolio;
  const start  = p?.startingCapitalTon ?? 15;
  const wins   = trades.filter((t) => t.pnlTon > 0);
  const losses = trades.filter((t) => t.pnlTon <= 0);
  const avgWin  = wins.length   ? wins.reduce((s, t) => s + t.pnlTon, 0)   / wins.length   : 0;
  const avgLoss = losses.length ? losses.reduce((s, t) => s + t.pnlTon, 0) / losses.length : 0;
  const avgHold = trades.length ? trades.reduce((s, t) => s + t.holdMinutes, 0) / trades.length : 0;
  const profitFactor = losses.length && wins.length
    ? Math.abs(avgWin * wins.length / (avgLoss * losses.length))
    : null;

  const equityCurve = buildEquityCurve(trades, start);
  const pnlBars     = buildPnlBars(trades);
  const holdBuckets = buildHoldBuckets(trades);
  const CHART_H     = 240;

  const kpis = [
    { label: "Total Trades",  value: String(trades.length), sub: `${wins.length}W · ${losses.length}L` },
    { label: "Win Rate",      value: trades.length ? `${(wins.length / trades.length * 100).toFixed(1)}%` : "—",
      cls: wins.length > losses.length ? "positive" : "negative", sub: "Closed positions" },
    { label: "Avg Win",       value: wins.length   ? `+${avgWin.toFixed(4)} TON`   : "—", cls: "positive", sub: "Per winning trade" },
    { label: "Avg Loss",      value: losses.length ? `${avgLoss.toFixed(4)} TON`   : "—", cls: "negative", sub: "Per losing trade" },
    { label: "Avg Hold",      value: avgHold ? `${avgHold.toFixed(0)} min` : "—", sub: "Per closed trade" },
    { label: "Profit Factor", value: profitFactor != null ? profitFactor.toFixed(2) : "—",
      cls: profitFactor != null ? (profitFactor >= 1 ? "positive" : "negative") : "", sub: "Gross wins / gross losses" },
  ];

  return (
    <AdminShell>
      <div className="section-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-desc">{trades.length} closed trades · refreshes every 30s</p>
        </div>
      </div>

      {err && <div className="mock-banner">⚠ {err}</div>}

      {/* KPI row */}
      <div className="stat-grid" style={{ marginBottom: 32 }}>
        {kpis.map((s) => (
          <div key={s.label} className="card card-sm">
            <div className="card-title">{s.label}</div>
            <div className={`card-value mono ${s.cls ?? ""}`}>{s.value}</div>
            <div className="card-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Equity Curve */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-title" style={{ marginBottom: 4 }}>Equity Curve</div>
        <div className="card-sub" style={{ marginBottom: 20 }}>Portfolio value after each closed trade</div>
        {trades.length === 0 ? (
          <div className="empty-state">No closed trades yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={CHART_H}>
            <LineChart data={equityCurve} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={MUTED} strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fill: TEXT3, fontSize: 11 }} tickLine={false} interval="preserveStartEnd" />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fill: TEXT3, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => v.toFixed(2)}
                width={50}
              />
              <ReferenceLine y={start} stroke={GOLD} strokeDasharray="4 4" strokeWidth={1} />
              <Tooltip content={<EquityTip />} />
              <Line type="monotone" dataKey="value" stroke={GOLD} strokeWidth={2}
                dot={{ r: 3, fill: GOLD, strokeWidth: 0 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Win / Loss Donut */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-title" style={{ marginBottom: 4 }}>Win / Loss</div>
        <div className="card-sub" style={{ marginBottom: 20 }}>Share of winning vs losing closed trades</div>
        {trades.length === 0 ? (
          <div className="empty-state">No closed trades yet</div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
            <ResponsiveContainer width={220} height={220}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Wins",   value: wins.length },
                    { name: "Losses", value: losses.length },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  <Cell fill={GREEN} />
                  <Cell fill={RED} />
                </Pie>
                <Tooltip
                  {...TIP_STYLE}
                  formatter={(v: unknown) => [`${v} trades`]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { label: "Wins",       value: wins.length,    pct: trades.length ? (wins.length / trades.length * 100).toFixed(1) : "0",    color: GREEN },
                { label: "Losses",     value: losses.length,  pct: trades.length ? (losses.length / trades.length * 100).toFixed(1) : "0",  color: RED   },
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: row.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: ".78rem", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".06em" }}>{row.label}</div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 700, fontFamily: "var(--font-mono)", color: row.color }}>
                      {row.value} <span style={{ fontSize: ".85rem", fontWeight: 400, color: "var(--text-2)" }}>({row.pct}%)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* P&L per Trade */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-title" style={{ marginBottom: 4 }}>P&L per Trade</div>
        <div className="card-sub" style={{ marginBottom: 20 }}>Realized profit/loss in TON per closed position</div>
        {trades.length === 0 ? (
          <div className="empty-state">No closed trades yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={CHART_H}>
            <BarChart data={pnlBars} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={MUTED} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: TEXT3, fontSize: 11 }} tickLine={false} />
              <YAxis
                tick={{ fill: TEXT3, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v > 0 ? "+" : ""}${v.toFixed(3)}`}
                width={56}
              />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
              <Tooltip content={<PnlTip />} />
              <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                {pnlBars.map((d, i) => (
                  <Cell key={i} fill={d.pnl >= 0 ? GREEN : RED} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Hold Time Distribution */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: 4 }}>Hold Time Distribution</div>
        <div className="card-sub" style={{ marginBottom: 20 }}>Number of trades per hold-duration bucket</div>
        {trades.length === 0 ? (
          <div className="empty-state">No closed trades yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={CHART_H}>
            <BarChart data={holdBuckets} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={MUTED} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: TEXT3, fontSize: 11 }} tickLine={false} />
              <YAxis
                allowDecimals={false}
                tick={{ fill: TEXT3, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <Tooltip
                {...TIP_STYLE}
                formatter={(v: unknown) => [`${v} trades`, "Count"]}
              />
              <Bar dataKey="count" fill={GOLD} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </AdminShell>
  );
}
