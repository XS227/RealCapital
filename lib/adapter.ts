/**
 * Read-only data adapter for the TON Momentum Hunter trading agent.
 *
 * Reads from memory.json only — never writes, never modifies trading logic.
 * All types mirror the agent's stored schema exactly.
 *
 * Connect real data: set MEMORY_JSON_PATH env var to the agent's memory.json.
 * If the file is missing or LIVE_DATA=0, returns mock data.
 */

import { promises as fs } from "fs";

const MEMORY_PATH =
  process.env.MEMORY_JSON_PATH || "/home/ubuntu/ton-momentum-hunter/memory.json";
const LIVE = process.env.LIVE_DATA !== "0";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Portfolio {
  startingCapitalTon: number;
  cashTon: number;
  totalValueTon: number;
  realizedPnlTon: number;
  unrealizedPnlTon: number;
  peakValueTon: number;
  maxDrawdownPercent: number;
  roiPercent: number;
  winRate: number;
  totalTrades: number;
}

export interface OpenPosition {
  id: string;
  symbol: string;
  dex: string;
  entryPriceTon: number;
  currentPriceTon: number;
  costTon: number;
  currentValueTon: number;
  pnlTon: number;
  pnlPercent: number;
  ageMinutes: number;
  entrySignals: string[];
  confidence: number;
  reasoning: string;
  openedAt: number;
}

export interface ClosedTrade {
  id: string;
  symbol: string;
  dex: string;
  entryPriceTon: number;
  exitPriceTon: number;
  costTon: number;
  proceedsTon: number;
  pnlTon: number;
  pnlPercent: number;
  holdMinutes: number;
  exitReason: string;
  confidence: number;
  momentumScore: number;
  rugRiskScore: number;
  reasoning: string;
  riskWarning: string;
  openedAt: number;
  closedAt: number;
}

export interface AiDecision {
  ts: number;
  symbol: string;
  action: "BUY" | "SELL" | "HOLD";
  confidence: number;
  momentumScore: number;
  rugRiskScore: number;
  entryQualityScore: number;
  reasoning: string;
  source: string;
  priceTon: number;
  liquidityTon: number;
}

export interface MissedCandidate {
  symbol: string;
  poolId: string;
  startedAt: number;
  primaryReason: string;
  maxMovePct: number;
  rejectionCorrect: boolean;
  rejectCount: number;
}

export interface ProtectionEvent {
  ts: number;
  symbol: string;
  positionId: string;
  ageMinutes: number;
  reason: string;
  aiReasoning: string;
  exitConfidence: number;
  rugRiskScore: number;
}

export interface ProtectionStatus {
  mode: string;
  cpActive: boolean;
  cpSince: number | null;
  cpTriggers: string[];
  dailyStop: boolean;
  dailyStopReason: string | null;
  cooldownUntil: number | null;
  cooldownReason: string | null;
}

export interface AgentStatus {
  running: boolean;
  simulationMode: boolean;
  paused: boolean;
  pausedReason: string | null;
  lastActivityAt: number | null;
  protection: ProtectionStatus;
}

export interface FullDashboard {
  portfolio: Portfolio;
  agentStatus: AgentStatus;
  openPositions: OpenPosition[];
  closedTrades: ClosedTrade[];
  recentDecisions: AiDecision[];
  missedCandidates: MissedCandidate[];
  blockedExits: ProtectionEvent[];
  isMock: boolean;
  updatedAt: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function num(v: unknown, d = 0): number {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : d;
}

function minutesSince(epochSeconds: number, nowMs: number): number {
  return (nowMs / 1000 - epochSeconds) / 60;
}

function winRate(trades: any[]): number {
  if (!trades.length) return 0;
  const wins = trades.filter((t) => num(t.pnl_ton) > 0).length;
  return +((wins / trades.length) * 100).toFixed(1);
}

// ── Mappers ────────────────────────────────────────────────────────────────────

function mapPortfolio(pf: any, trades: any[]): Portfolio {
  const start = num(pf.starting_capital_ton, 15) || 15;
  const value = num(pf.total_value_ton, start);
  return {
    startingCapitalTon: +start.toFixed(3),
    cashTon: +num(pf.cash_ton, start).toFixed(3),
    totalValueTon: +value.toFixed(3),
    realizedPnlTon: +num(pf.realized_pnl_ton).toFixed(4),
    unrealizedPnlTon: +num(pf.unrealized_pnl_ton).toFixed(4),
    peakValueTon: +num(pf.peak_value_ton, value).toFixed(3),
    maxDrawdownPercent: +num(pf.max_drawdown_percent).toFixed(2),
    roiPercent: +((value / start - 1) * 100).toFixed(2),
    winRate: winRate(trades),
    totalTrades: trades.length,
  };
}

function mapOpenPositions(raw: any[], nowMs: number): OpenPosition[] {
  return (raw || []).map((p: any): OpenPosition => {
    const cost = num(p.cost_ton);
    const value = num(p.current_value_ton, cost);
    const entry = num(p.entry_price_ton);
    const current = num(p.current_price_ton, entry);
    const dec = p.entry_decision || {};
    return {
      id: String(p.id || ""),
      symbol: String(p.symbol || "?"),
      dex: String(p.dex || ""),
      entryPriceTon: entry,
      currentPriceTon: current,
      costTon: +cost.toFixed(4),
      currentValueTon: +value.toFixed(4),
      pnlTon: +(value - cost).toFixed(4),
      pnlPercent: cost ? +((value / cost - 1) * 100).toFixed(2) : 0,
      ageMinutes: +Math.max(0, minutesSince(num(p.opened_at), nowMs)).toFixed(1),
      entrySignals: Array.isArray(p.entry_signals) ? p.entry_signals : [],
      confidence: +num(dec.confidence).toFixed(2),
      reasoning: String(dec.reasoning || "").slice(0, 200),
      openedAt: num(p.opened_at),
    };
  });
}

function mapClosedTrades(raw: any[]): ClosedTrade[] {
  return (raw || [])
    .slice()
    .reverse()
    .map((t: any): ClosedTrade => {
      const dec = t.entry_decision || {};
      return {
        id: String(t.id || ""),
        symbol: String(t.symbol || "?"),
        dex: String(t.dex || ""),
        entryPriceTon: num(t.entry_price_ton),
        exitPriceTon: num(t.exit_price_ton),
        costTon: +num(t.cost_ton).toFixed(4),
        proceedsTon: +num(t.proceeds_ton).toFixed(4),
        pnlTon: +num(t.pnl_ton).toFixed(4),
        pnlPercent: +num(t.pnl_percent).toFixed(2),
        holdMinutes: +num(t.hold_minutes).toFixed(1),
        exitReason: String(t.exit_reason || ""),
        confidence: +num(dec.confidence).toFixed(2),
        momentumScore: Math.round(num(dec.momentum_score)),
        rugRiskScore: Math.round(num(dec.rug_risk_score)),
        reasoning: String(dec.reasoning || "").slice(0, 300),
        riskWarning: String(dec.risk_warning || "").slice(0, 200),
        openedAt: num(t.opened_at),
        closedAt: num(t.closed_at),
      };
    });
}

function mapDecisions(raw: any[]): AiDecision[] {
  return (raw || [])
    .slice(-500)
    .reverse()
    .map((d: any): AiDecision => {
      const dec = d.decision || {};
      const ctx = d.context || {};
      return {
        ts: num(d.ts),
        symbol: String(d.symbol || "?"),
        action: (dec.action as AiDecision["action"]) || "HOLD",
        confidence: +num(dec.confidence).toFixed(2),
        momentumScore: Math.round(num(dec.momentum_score)),
        rugRiskScore: Math.round(num(dec.rug_risk_score)),
        entryQualityScore: Math.round(num(dec.entry_quality_score)),
        reasoning: String(dec.reasoning || "").slice(0, 200),
        source: String(dec.source || ""),
        priceTon: num(ctx.price_ton),
        liquidityTon: +num(ctx.liquidity_ton).toFixed(0),
      };
    });
}

function mapMissed(raw: any[]): MissedCandidate[] {
  return (raw || [])
    .slice(-200)
    .reverse()
    .map((m: any): MissedCandidate => ({
      symbol: String(m.symbol || "?"),
      poolId: String(m.pool_id || ""),
      startedAt: num(m.started_at),
      primaryReason: String(m.primary_reason || ""),
      maxMovePct: +num(m.max_move_pct).toFixed(2),
      rejectionCorrect: Boolean(m.rejection_correct),
      rejectCount: Math.round(num(m.reject_count)),
    }));
}

function mapBlockedExits(raw: any[]): ProtectionEvent[] {
  return (raw || [])
    .slice()
    .reverse()
    .map((b: any): ProtectionEvent => ({
      ts: num(b.ts),
      symbol: String(b.symbol || "?"),
      positionId: String(b.position_id || ""),
      ageMinutes: +num(b.age_minutes).toFixed(1),
      reason: `Hold min ${num(b.min_hold_minutes)}m (age ${num(b.age_minutes).toFixed(1)}m)`,
      aiReasoning: String(b.ai_reasoning || "").slice(0, 300),
      exitConfidence: +num(b.exit_confidence).toFixed(2),
      rugRiskScore: Math.round(num(b.rug_risk_score)),
    }));
}

function mapProtection(prot: any): ProtectionStatus {
  return {
    mode: String(prot?.mode || "NORMAL"),
    cpActive: Boolean(prot?.cp_active),
    cpSince: prot?.cp_since ? num(prot.cp_since) : null,
    cpTriggers: Array.isArray(prot?.cp_triggers) ? prot.cp_triggers : [],
    dailyStop: Boolean(prot?.daily_stop),
    dailyStopReason: prot?.daily_stop_reason ?? null,
    cooldownUntil: prot?.cooldown_until ? num(prot.cooldown_until) : null,
    cooldownReason: prot?.cooldown_reason ?? null,
  };
}

function mapAgentStatus(s: any, nowMs: number): AgentStatus {
  const trades = Array.isArray(s.closed_trades) ? s.closed_trades : [];
  const decisions = Array.isArray(s.ai_decisions) ? s.ai_decisions : [];
  const lastActivityEpoch =
    decisions.length ? num(decisions[decisions.length - 1].ts) : null;
  const lastActivityAt = lastActivityEpoch
    ? lastActivityEpoch * 1000
    : trades.length
    ? num(trades[trades.length - 1].closed_at) * 1000
    : null;

  const sim = s.simulation || {};
  return {
    running: !sim.paused,
    simulationMode: true,
    paused: Boolean(sim.paused),
    pausedReason: sim.paused_reason ?? null,
    lastActivityAt,
    protection: mapProtection(s.protection),
  };
}

// ── Public API ─────────────────────────────────────────────────────────────────

export async function readFullDashboard(): Promise<FullDashboard> {
  const nowMs = Date.now();
  if (LIVE) {
    try {
      const raw = await fs.readFile(MEMORY_PATH, "utf-8");
      const s = JSON.parse(raw);
      const trades = Array.isArray(s.closed_trades) ? s.closed_trades : [];
      return {
        portfolio: mapPortfolio(s.portfolio || {}, trades),
        agentStatus: mapAgentStatus(s, nowMs),
        openPositions: mapOpenPositions(s.open_positions, nowMs),
        closedTrades: mapClosedTrades(trades),
        recentDecisions: mapDecisions(s.ai_decisions),
        missedCandidates: mapMissed(s.missed_candidates),
        blockedExits: mapBlockedExits(s.blocked_exits),
        isMock: false,
        updatedAt: nowMs,
      };
    } catch {
      // fall through to mock
    }
  }
  return makeMockDashboard(nowMs);
}

// ── Mock data ──────────────────────────────────────────────────────────────────

function makeMockDashboard(nowMs: number): FullDashboard {
  return {
    portfolio: {
      startingCapitalTon: 15,
      cashTon: 13.4,
      totalValueTon: 14.8,
      realizedPnlTon: -0.22,
      unrealizedPnlTon: 0.18,
      peakValueTon: 16.2,
      maxDrawdownPercent: 4.5,
      roiPercent: -1.33,
      winRate: 44.4,
      totalTrades: 9,
    },
    agentStatus: {
      running: true,
      simulationMode: true,
      paused: false,
      pausedReason: null,
      lastActivityAt: nowMs - 120_000,
      protection: {
        mode: "NORMAL",
        cpActive: false,
        cpSince: null,
        cpTriggers: [],
        dailyStop: false,
        dailyStopReason: null,
        cooldownUntil: null,
        cooldownReason: null,
      },
    },
    openPositions: [
      {
        id: "mock-001",
        symbol: "JETTON",
        dex: "stonfi",
        entryPriceTon: 0.00421,
        currentPriceTon: 0.00449,
        costTon: 2.5,
        currentValueTon: 2.66,
        pnlTon: 0.16,
        pnlPercent: 6.4,
        ageMinutes: 18,
        entrySignals: ["volume_spike", "buy_imbalance"],
        confidence: 0.78,
        reasoning: "Strong momentum with 4.2x volume spike and positive buy pressure.",
        openedAt: (nowMs - 1_080_000) / 1000,
      },
    ],
    closedTrades: [
      {
        id: "mock-t1",
        symbol: "TON",
        dex: "dedust",
        entryPriceTon: 2.8,
        exitPriceTon: 3.1,
        costTon: 3.0,
        proceedsTon: 3.32,
        pnlTon: 0.32,
        pnlPercent: 10.7,
        holdMinutes: 42,
        exitReason: "take_profit",
        confidence: 0.81,
        momentumScore: 82,
        rugRiskScore: 18,
        reasoning: "High momentum with sustained buy pressure.",
        riskWarning: "Thin liquidity risk.",
        openedAt: (nowMs - 3_600_000) / 1000,
        closedAt: (nowMs - 1_080_000) / 1000,
      },
      {
        id: "mock-t2",
        symbol: "BOLT",
        dex: "stonfi",
        entryPriceTon: 0.0012,
        exitPriceTon: 0.00108,
        costTon: 2.0,
        proceedsTon: 1.8,
        pnlTon: -0.2,
        pnlPercent: -10.0,
        holdMinutes: 22,
        exitReason: "stop_loss",
        confidence: 0.72,
        momentumScore: 68,
        rugRiskScore: 32,
        reasoning: "Early momentum signal reversed faster than expected.",
        riskWarning: "High rug risk score — reduced size.",
        openedAt: (nowMs - 7_200_000) / 1000,
        closedAt: (nowMs - 5_880_000) / 1000,
      },
    ],
    recentDecisions: [
      {
        ts: (nowMs - 90_000) / 1000,
        symbol: "TSHIB",
        action: "HOLD",
        confidence: 0.61,
        momentumScore: 55,
        rugRiskScore: 42,
        entryQualityScore: 48,
        reasoning: "Confidence below threshold (0.61 < 0.70). Rug risk elevated.",
        source: "ai",
        priceTon: 0.000023,
        liquidityTon: 4200,
      },
    ],
    missedCandidates: [
      {
        symbol: "PIXL",
        poolId: "stonfi:mock",
        startedAt: (nowMs - 600_000) / 1000,
        primaryReason: "confidence 0.65 < 0.70; volume spike 1.8x < 3.0x",
        maxMovePct: 12.4,
        rejectionCorrect: false,
        rejectCount: 3,
      },
    ],
    blockedExits: [],
    isMock: true,
    updatedAt: nowMs,
  };
}
