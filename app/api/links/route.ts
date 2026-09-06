import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/utils";
import { linkAccessWhere } from "@/lib/link-access";

/**
 * GET /api/links?page=1&limit=20
 *
 * Returns a paginated list of all links with stats.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const skip = (page - 1) * limit;

  const [links, total] = await Promise.all([
    prisma.link.findMany({
      where: linkAccessWhere(session.user.id),
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        slug: true,
        url: true,
        clicks: true,
        expiresAt: true,
        passwordHash: true,
        teamId: true,
        createdAt: true,
      },
    }),
    prisma.link.count({ where: linkAccessWhere(session.user.id) }),
  ]);

  const appUrl = getBaseUrl(request);

  return NextResponse.json({
    links: links.map(({ passwordHash, ...link }) => ({
      ...link,
      hasPassword: Boolean(passwordHash),
      shortUrl: `${appUrl}/${link.slug}`,
    })),
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
  });
}
