import type { Prisma, TeamRole } from "@prisma/client";
import { prisma } from "./prisma";

export type LinkAccessMode = "read" | "write";

export const TEAM_WRITE_ROLES: TeamRole[] = ["admin", "editor"];

export function linkAccessWhere(
  userId: string,
  mode: LinkAccessMode = "read"
): Prisma.LinkWhereInput {
  return {
    OR: [
      { userId, teamId: null },
      {
        team: {
          members: {
            some: {
              userId,
              ...(mode === "write" ? { role: { in: TEAM_WRITE_ROLES } } : {}),
            },
          },
        },
      },
    ],
  };
}

export async function hasTeamRole(
  userId: string,
  teamId: string,
  roles: TeamRole[] = TEAM_WRITE_ROLES
): Promise<boolean> {
  const membership = await prisma.teamMember.findFirst({
    where: { userId, teamId, role: { in: roles } },
    select: { id: true },
  });
  return Boolean(membership);
}
