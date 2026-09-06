import Link from "next/link";
import { UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TeamNotFound() {
  return (
    <div className="dispatch-status-page">
      <section className="dispatch-status-ticket" aria-labelledby="team-not-found-title">
        <UsersRound className="dispatch-status-ticket__icon" aria-hidden="true" />
        <h1 id="team-not-found-title">Team unavailable</h1>
        <p className="dispatch-auth-ticket__code">WORKSPACE STATUS / 404</p>
        <p>This team does not exist, or your account no longer has access to it.</p>
        <Button asChild className="dispatch-commit-action">
          <Link href="/dashboard/teams">Return to teams</Link>
        </Button>
      </section>
    </div>
  );
}
