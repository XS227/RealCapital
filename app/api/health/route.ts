import { NextResponse } from "next/server";
import { checkDataSource } from "@/lib/adapter";
import pkg from "@/package.json";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const startedAt = Date.now();

export async function GET() {
  const dataSourceConnected = await checkDataSource();

  return NextResponse.json({
    status: "ok",
    version: pkg.version,
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    dataSourceConnected,
    environment: process.env.NODE_ENV ?? "unknown",
  });
}
