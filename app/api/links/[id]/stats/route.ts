import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { linkAccessWhere } from "@/lib/link-access";

/**
 * GET /api/links/:id/stats?days=30
 *
 * Returns time-series click data and top referers for a link.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const days = Math.min(90, Math.max(1, Number(searchParams.get("days") ?? 30)));

  const link = await prisma.link.findFirst({
    where: { id, ...linkAccessWhere(session.user.id) },
    select: { id: true, slug: true, url: true, clicks: true, expiresAt: true, teamId: true, createdAt: true },
  });
  if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const events = await prisma.clickEvent.findMany({
    where: { linkId: id, createdAt: { gte: since } },
    select: { createdAt: true, referer: true },
  });

  // Group by day (pre-filled so chart has no gaps)
  const byDay: Record<string, number> = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    byDay[d.toISOString().split("T")[0]] = 0;
  }
  for (const e of events) {
    const day = e.createdAt.toISOString().split("T")[0];
    byDay[day] = (byDay[day] ?? 0) + 1;
  }

  const refererCounts: Record<string, number> = {};
  for (const e of events) {
    const key = e.referer || "Direct";
    refererCounts[key] = (refererCounts[key] ?? 0) + 1;
  }
  const topReferers = Object.entries(refererCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([referer, count]) => ({ referer, count }));

  return NextResponse.json({
    link,
    clicksByDay: Object.entries(byDay).map(([date, clicks]) => ({ date, clicks })),
    topReferers,
    totalInPeriod: events.length,
    days,
  });
}
