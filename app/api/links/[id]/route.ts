import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { getBaseUrl } from "@/lib/utils";
import { linkAccessWhere } from "@/lib/link-access";

/**
 * DELETE /api/links/:id
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  const { id } = await params;

  try {
    const link = await prisma.link.findFirst({
      where: { id, ...linkAccessWhere(session.user.id, "write") },
      select: { id: true, slug: true },
    });
    if (!link) return NextResponse.json({ error: "Link not found" }, { status: 404 });
    await prisma.link.delete({ where: { id: link.id } });
    await redis.del(`link:${link.slug}`);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }
}

/**
 * GET /api/links/:id
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
  const link = await prisma.link.findFirst({
    where: { id, ...linkAccessWhere(session.user.id) },
    select: {
      id: true,
      slug: true,
      url: true,
      clicks: true,
      isPinned: true,
      isActive: true,
      isArchived: true,
      notes: true,
      expiresAt: true,
      userId: true,
      folderId: true,
      teamId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ...link, shortUrl: `${getBaseUrl(request)}/${link.slug}` });
}
