"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { verifyLinkPassword } from "@/lib/actions";

export function PasswordForm({ slug }: { slug: string }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await verifyLinkPassword(slug, password);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push(`/${slug}`);
    });
  }

  return (
    <Card className="dispatch-password-ticket w-full max-w-md">
      <CardHeader>
        <div className="mb-3 flex h-12 w-12 items-center justify-center border border-primary text-primary">
          <Lock className="h-5 w-5" />
        </div>
        <CardTitle>Password required</CardTitle>
        <p className="dispatch-auth-ticket__code">ROUTE / PROTECTED HANDOFF</p>
        <CardDescription>
          This link is protected. Enter the password to continue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="dispatch-access-form space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pw">Password</Label>
            <Input
              id="pw"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              disabled={isPending}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <Button type="submit" className="dispatch-commit-action w-full" disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : "Continue"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
