import { NextRequest, NextResponse } from "next/server";
import { readFullDashboard, BridgeUnavailableError } from "@/lib/adapter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CACHE_MS = 4_000;
let cache: { at: number; data: unknown } | null = null;

const RATE_MAP = new Map<string, { count: number; reset: number }>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const e = RATE_MAP.get(ip);
  if (!e || now > e.reset) { RATE_MAP.set(ip, { count: 1, reset: now + 10_000 }); return false; }
  e.count += 1;
  if (RATE_MAP.size > 5000) RATE_MAP.clear();
  return e.count > 30;
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(ip)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const now = Date.now();
  if (cache && now - cache.at < CACHE_MS) return NextResponse.json(cache.data);

  try {
    const full = await readFullDashboard();
    const pub = {
      portfolio: {
        totalValueTon: full.portfolio.totalValueTon,
        roiPercent: full.portfolio.roiPercent,
        realizedPnlTon: full.portfolio.realizedPnlTon,
        maxDrawdownPercent: full.portfolio.maxDrawdownPercent,
        totalTrades: full.portfolio.totalTrades,
        winRate: full.portfolio.winRate,
      },
      agentStatus: {
        running: full.agentStatus.running,
        paused: full.agentStatus.paused,
        protectionMode: full.agentStatus.protection.mode,
      },
      openPositionCount: full.openPositions.length,
      updatedAt: full.updatedAt,
    };
    cache = { at: now, data: pub };
    return NextResponse.json(pub);
  } catch (err) {
    if (err instanceof BridgeUnavailableError) {
      return NextResponse.json({ error: "Bridge unavailable" }, { status: 503 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
