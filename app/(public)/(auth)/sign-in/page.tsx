import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your shrten account to manage and track your short links.",
  robots: { index: false, follow: false },
};
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { CredentialsForm } from "@/components/credentials-form";
import { authEntryHref, resolveAuthCallback } from "@/lib/auth-redirect";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const destination = resolveAuthCallback(callbackUrl);

  return (
    <div className="dispatch-auth-page">
      <Card className="dispatch-auth-ticket">
        <CardHeader>
          <h1 className="dispatch-auth-ticket__title">Welcome back</h1>
          <p className="dispatch-auth-ticket__code">ACCESS / RETURNING OPERATOR</p>
          <CardDescription>Use your email and password to open your link ledger.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Suspense>
            <CredentialsForm />
          </Suspense>

          <p className="dispatch-auth-switch text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href={authEntryHref("/sign-up", destination)}
              className="text-primary hover:underline font-medium"
            >
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
      <aside className="dispatch-auth-context" aria-label="Account benefits">
        <h2>Keep every handoff on record.</h2>
        <p className="dispatch-auth-context__mark">shrten / account access</p>
        <p>
          Sign in to organize short links, inspect traffic, and work from shared team ledgers.
        </p>
        <ol>
          <li><span>01</span> Issue and edit links</li>
          <li><span>02</span> Read click activity</li>
          <li><span>03</span> Route team work</li>
        </ol>
      </aside>
    </div>
  );
}
