"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createTeam } from "@/lib/team-actions";
import { toast } from "sonner";

export default function NewTeamPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    if (!name.trim()) return;
    startTransition(async () => {
      const res = await createTeam(name.trim());
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success("Team created!");
      router.push(`/dashboard/teams/${res.data.id}`);
    });
  }

  return (
    <div className="dispatch-workspace dispatch-workspace--narrow">
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href="/dashboard/teams">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Teams
        </Link>
      </Button>

      <Card className="dispatch-ledger-panel">
        <CardHeader>
          <CardTitle>Create a new team</CardTitle>
          <p className="dispatch-page-code">WORKSPACE INTAKE / NEW TEAM</p>
          <CardDescription>
            Teams let you collaborate on shared links with colleagues.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="team-name">Team name</Label>
            <Input
              id="team-name"
              placeholder="Acme Corp"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
          </div>
          <Button
            className="dispatch-commit-action w-full"
            onClick={handleCreate}
            disabled={isPending || !name.trim()}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Create Team
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
