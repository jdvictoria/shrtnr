import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { ArrowLeft, Link2, Users } from "lucide-react";
import { auth } from "@/auth";
import { getTeam, getTeamLinks, getMyRole } from "@/lib/team-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeleteTeamButton, TeamActions } from "@/components/team-actions";
import { LinksTable } from "@/components/links-table";
import { AddLinkDialog } from "@/components/add-link-dialog";

export default async function TeamPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ joined?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const { id } = await params;
  const { joined } = await searchParams;

  const [team, myRole, teamLinks] = await Promise.all([
    getTeam(id),
    getMyRole(id),
    getTeamLinks(id),
  ]);

  if (!team || !myRole) notFound();

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto")?.split(",")[0] ?? "http";
  const appUrl = `${proto}://${host}`;

  const canManageLinks = myRole === "admin" || myRole === "editor";

  return (
    <div className="dispatch-workspace dispatch-workspace--measure">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href="/dashboard/teams">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Teams
        </Link>
      </Button>

      {joined && (
        <div className="mb-6 border border-success/30 bg-success/10 px-4 py-3 text-sm text-success" role="status">
          Welcome to the team!
        </div>
      )}

      {/* Header */}
      <div className="dispatch-page-header flex flex-col gap-5 mb-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1>{team.name}</h1>
          <p className="dispatch-page-code">TEAM LEDGER / @{team.slug}</p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:justify-end">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {team.members.length} member{team.members.length !== 1 ? "s" : ""}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link2 className="h-4 w-4" />
            {team._count.links} link{team._count.links !== 1 ? "s" : ""}
          </div>
          <Badge
            variant={
              myRole === "admin"
                ? "default"
                : myRole === "editor"
                ? "secondary"
                : "outline"
            }
          >
            {myRole}
          </Badge>
          {canManageLinks && (
            <AddLinkDialog
              folders={[]}
              appUrl={appUrl}
              teamId={team.id}
              triggerLabel="New team link"
            />
          )}
          {myRole === "admin" && <DeleteTeamButton teamId={team.id} teamName={team.name} />}
        </div>
      </div>

      <Tabs defaultValue="members">
        <TabsList className="mb-6">
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <Card className="dispatch-ledger-panel">
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage who has access to this team workspace.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TeamActions
                teamId={team.id}
                myRole={myRole}
                members={team.members.map((m) => ({
                  id: m.id,
                  role: m.role as "admin" | "editor" | "viewer",
                  user: {
                    id: m.user.id,
                    name: m.user.name,
                    email: m.user.email,
                    image: m.user.image,
                  },
                }))}
                invitations={team.invitations.map((inv) => ({
                  id: inv.id,
                  email: inv.email,
                  role: inv.role as "admin" | "editor" | "viewer",
                  token: inv.token,
                  expiresAt: inv.expiresAt,
                }))}
                currentUserId={session.user.id!}
                appUrl={appUrl}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links">
          {teamLinks.length === 0 ? (
            <Card className="dispatch-ledger-panel">
              <CardContent className="flex flex-col items-center py-12 text-center">
                <p className="text-muted-foreground">
                  {canManageLinks
                    ? "No team links have been issued yet."
                    : "No links have been shared with this team yet."}
                </p>
                {canManageLinks && (
                  <AddLinkDialog
                    folders={[]}
                    appUrl={appUrl}
                    teamId={team.id}
                    triggerLabel="Create the first team link"
                  />
                )}
              </CardContent>
            </Card>
          ) : (
            <LinksTable
              links={teamLinks.map((l) => ({
                ...l,
                notes: l.notes ?? null,
                folder: l.folder ?? null,
              }))}
              folders={[]}
              tags={[]}
              page={1}
              totalPages={1}
              total={teamLinks.length}
              appUrl={appUrl}
              canManage={canManageLinks}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
