"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "./prisma";
import type { ActionResult } from "./actions";
import { nanoid } from "nanoid";

const TEAM_ROLES = ["admin", "editor", "viewer"] as const;

function isTeamRole(value: string): value is (typeof TEAM_ROLES)[number] {
  return TEAM_ROLES.includes(value as (typeof TEAM_ROLES)[number]);
}

export async function getMyTeams() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const memberships = await prisma.teamMember.findMany({
    where: { userId: session.user.id },
    include: {
      team: {
        include: {
          _count: { select: { members: true, links: true } },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });
  return memberships.map((m) => ({ ...m.team, role: m.role }));
}

export async function createTeam(
  name: string
): Promise<ActionResult<{ id: string; slug: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  if (!name.trim()) return { success: false, error: "Name is required" };

  const slug =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") +
    "-" +
    nanoid(4);

  try {
    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        slug,
        members: { create: { userId: session.user.id, role: "admin" } },
      },
    });
    revalidatePath("/dashboard/teams");
    return { success: true, data: { id: team.id, slug: team.slug } };
  } catch {
    return { success: false, error: "Failed to create team" };
  }
}

export async function getTeam(id: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const membership = await prisma.teamMember.findFirst({
    where: { teamId: id, userId: session.user.id },
  });
  if (!membership) return null;

  return prisma.team.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
      invitations: { orderBy: { createdAt: "desc" } },
      _count: { select: { links: true } },
    },
  });
}

export async function inviteMember(
  teamId: string,
  email: string,
  role: "admin" | "editor" | "viewer" = "editor"
): Promise<ActionResult<{ token: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { success: false, error: "Enter a valid email address" };
  }
  if (!isTeamRole(role)) return { success: false, error: "Select a valid role" };

  // Must be admin
  const membership = await prisma.teamMember.findFirst({
    where: { teamId, userId: session.user.id, role: "admin" },
  });
  if (!membership) return { success: false, error: "Only admins can invite members" };

  const existingMember = await prisma.teamMember.findFirst({
    where: { teamId, user: { email: normalizedEmail } },
    select: { id: true },
  });
  if (existingMember) {
    return { success: false, error: "That person is already a team member" };
  }

  const existingInvitation = await prisma.teamInvitation.findFirst({
    where: { teamId, email: normalizedEmail, expiresAt: { gt: new Date() } },
    select: { id: true },
  });
  if (existingInvitation) {
    return { success: false, error: "An active invitation already exists for that email" };
  }

  try {
    const inv = await prisma.teamInvitation.create({
      data: {
        teamId,
        email: normalizedEmail,
        role,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });
    return { success: true, data: { token: inv.token } };
  } catch {
    return { success: false, error: "Failed to create invitation" };
  }
}

export async function acceptInvitation(
  token: string
): Promise<ActionResult<{ teamId: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const inv = await prisma.teamInvitation.findUnique({ where: { token } });
  if (!inv) return { success: false, error: "Invalid invitation" };
  if (inv.expiresAt < new Date()) return { success: false, error: "Invitation expired" };
  if (!session.user.email || session.user.email.toLowerCase() !== inv.email.toLowerCase()) {
    return { success: false, error: "This invitation belongs to another email address" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const existingMembership = await tx.teamMember.findUnique({
        where: { teamId_userId: { teamId: inv.teamId, userId: session.user.id } },
        select: { id: true },
      });
      if (!existingMembership) {
        await tx.teamMember.create({
          data: { teamId: inv.teamId, userId: session.user.id, role: inv.role },
        });
      }
      await tx.teamInvitation.delete({ where: { token } });
    });
    revalidatePath("/dashboard/teams");
    return { success: true, data: { teamId: inv.teamId } };
  } catch {
    return { success: false, error: "Failed to accept invitation" };
  }
}

export async function updateMemberRole(
  teamId: string,
  memberId: string,
  role: "admin" | "editor" | "viewer"
): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  if (!isTeamRole(role)) return { success: false, error: "Select a valid role" };

  const myMembership = await prisma.teamMember.findFirst({
    where: { teamId, userId: session.user.id, role: "admin" },
  });
  if (!myMembership) return { success: false, error: "Only admins can change roles" };

  const target = await prisma.teamMember.findFirst({ where: { id: memberId, teamId } });
  if (!target) return { success: false, error: "Team member not found" };
  if (target.userId === session.user.id) {
    return { success: false, error: "You cannot change your own administrator role" };
  }
  if (target.role === "admin" && role !== "admin") {
    const adminCount = await prisma.teamMember.count({ where: { teamId, role: "admin" } });
    if (adminCount <= 1) return { success: false, error: "A team must keep at least one administrator" };
  }

  await prisma.teamMember.update({ where: { id: target.id }, data: { role } });
  revalidatePath(`/dashboard/teams/${teamId}`);
  return { success: true, data: undefined };
}

export async function removeMember(
  teamId: string,
  memberId: string
): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const myMembership = await prisma.teamMember.findFirst({
    where: { teamId, userId: session.user.id, role: "admin" },
  });
  if (!myMembership) return { success: false, error: "Only admins can remove members" };

  const target = await prisma.teamMember.findFirst({ where: { id: memberId, teamId } });
  if (!target) return { success: false, error: "Team member not found" };
  if (target.userId === session.user.id) {
    return { success: false, error: "You cannot remove yourself from this team" };
  }
  if (target.role === "admin") {
    const adminCount = await prisma.teamMember.count({ where: { teamId, role: "admin" } });
    if (adminCount <= 1) return { success: false, error: "A team must keep at least one administrator" };
  }

  await prisma.teamMember.delete({ where: { id: target.id } });
  revalidatePath(`/dashboard/teams/${teamId}`);
  return { success: true, data: undefined };
}

export async function getTeamLinks(teamId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const membership = await prisma.teamMember.findFirst({
    where: { teamId, userId: session.user.id },
  });
  if (!membership) return [];

  return prisma.link.findMany({
    where: { teamId, isArchived: false },
    orderBy: { createdAt: "desc" },
    include: {
      tags: { include: { tag: true } },
      folder: true,
      user: { select: { name: true, email: true, image: true } },
    },
  });
}

export async function deleteTeam(teamId: string): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const membership = await prisma.teamMember.findFirst({
    where: { teamId, userId: session.user.id, role: "admin" },
    select: { id: true },
  });
  if (!membership) return { success: false, error: "Only admins can delete a team" };

  try {
    await prisma.$transaction([
      prisma.link.updateMany({ where: { teamId }, data: { teamId: null } }),
      prisma.team.delete({ where: { id: teamId } }),
    ]);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/teams");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to delete team" };
  }
}

export async function getMyRole(teamId: string): Promise<"admin" | "editor" | "viewer" | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const membership = await prisma.teamMember.findFirst({
    where: { teamId, userId: session.user.id },
    select: { role: true },
  });
  return membership?.role ?? null;
}
