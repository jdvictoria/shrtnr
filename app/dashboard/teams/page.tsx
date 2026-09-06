import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getMyTeams } from "@/lib/team-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link2, Plus, Users } from "lucide-react";

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ joined?: string; error?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const { joined, error } = await searchParams;
  const teams = await getMyTeams();

  const roleBadgeVariant: Record<
    string,
    "default" | "secondary" | "outline"
  > = {
    admin: "default",
    editor: "secondary",
    viewer: "outline",
  };

  return (
    <div className="dispatch-workspace dispatch-workspace--measure">
      <div className="dispatch-page-header flex items-end justify-between mb-8 gap-4">
        <div>
          <h1>Teams</h1>
          <p className="dispatch-page-code">SHARED OPERATIONS / WORKSPACES</p>
          <p className="text-muted-foreground mt-1">
            Collaborate with your team on shared links
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/teams/new">
            <Plus className="h-4 w-4 mr-2" />
            New Team
          </Link>
        </Button>
      </div>

      {joined && (
        <div className="mb-6 border border-success/30 bg-success/10 px-4 py-3 text-sm text-success" role="status">
          You have successfully joined the team.
        </div>
      )}
      {error && (
        <div className="mb-6 border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
          {error === "email-mismatch"
            ? "This invitation was sent to a different email address. Sign in with the invited account to continue."
            : error === "invite-expired"
              ? "This invitation has expired. Ask a team administrator for a new link."
              : error === "invite-failed"
                ? "This invitation could not be accepted. Ask a team administrator for a new link."
                : "Invalid invitation link."}
        </div>
      )}

      {teams.length === 0 ? (
        <Card className="dispatch-ledger-panel">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No teams yet</h2>
            <p className="text-muted-foreground mb-6">
              Create a team to collaborate with others on shared links.
            </p>
            <Button asChild>
              <Link href="/dashboard/teams/new">
                <Plus className="h-4 w-4 mr-2" />
                Create your first team
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="dispatch-team-ledger grid">
          {teams.map((team) => (
            <Link key={team.id} href={`/dashboard/teams/${team.id}`}>
              <Card className="dispatch-team-row hover:border-primary transition-colors cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                      <CardDescription className="mt-0.5 font-mono text-xs">
                        @{team.slug}
                      </CardDescription>
                    </div>
                    <Badge variant={roleBadgeVariant[team.role] ?? "outline"}>
                      {team.role}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      {team._count.members} member
                      {team._count.members !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Link2 className="h-3.5 w-3.5" />
                      {team._count.links} link
                      {team._count.links !== 1 ? "s" : ""}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
