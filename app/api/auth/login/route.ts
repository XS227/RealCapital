import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { createHash } from "crypto";
import { sessionOptions } from "@/lib/session";
import type { SessionData } from "@/lib/session";

const RATE_MAP = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60_000; // 1 minute

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

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local";

  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Too many attempts. Try again in 1 minute." }, { status: 429 });
  }

  let password: string;
  try {
    const body = await req.json();
    password = String(body.password || "");
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!password) {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }

  const storedHash = process.env.ADMIN_PASSWORD_HASH || "";
  const inputHash = sha256(password);

  // Constant-time comparison to prevent timing attacks
  const match =
    storedHash.length > 0 &&
    storedHash.length === inputHash.length &&
    sha256(storedHash + inputHash) === sha256(storedHash + inputHash) && // dummy — real check below
    timingSafeEqual(inputHash, storedHash);

  if (!match) {
    await delay(500); // slow down brute force
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  session.isAdmin = true;
  await session.save();
  return res;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
