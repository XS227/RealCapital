import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { createHash, timingSafeEqual } from "crypto";
import { sessionOptions } from "@/lib/session";
import { config } from "@/lib/config";
import type { SessionData } from "@/lib/session";

// 5 attempts per IP per minute
const RATE_MAP = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT  = 5;
const RATE_WINDOW = 60_000;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = RATE_MAP.get(ip);
  if (!entry || now > entry.reset) {
    RATE_MAP.set(ip, { count: 1, reset: now + RATE_WINDOW });
    if (RATE_MAP.size > 2000) RATE_MAP.clear();
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

function sha256hex(s: string): string {
  return createHash("sha256").update(s, "utf8").digest("hex");
}

function constantTimeMatch(a: string, b: string): boolean {
  // Pad to same length so timingSafeEqual doesn't throw on mismatched buffers.
  // We also independently check the hash so length padding doesn't open a bypass.
  const bufA = Buffer.from(a.padEnd(128, "\0"));
  const bufB = Buffer.from(b.padEnd(128, "\0"));
  return timingSafeEqual(bufA, bufB) && a.length === b.length;
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local";

  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in 1 minute." },
      { status: 429 }
    );
  }

  let password: string;
  try {
    const body = await req.json();
    password = String(body?.password ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!password) {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }

  const storedHash = config.adminPasswordHash;

  if (!storedHash) {
    // Admin login not configured — refuse all attempts silently
    await delay(500);
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const inputHash = sha256hex(password);
  const match = constantTimeMatch(inputHash, storedHash);

  if (!match) {
    await delay(500);
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  session.isAdmin = true;
  await session.save();
  return res;
}
