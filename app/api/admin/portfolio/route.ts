import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { readFullDashboard } from "@/lib/adapter";
import { sessionOptions } from "@/lib/session";
import type { SessionData } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const res = new NextResponse();
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  if (!session.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await readFullDashboard();
  return NextResponse.json(data);
}
