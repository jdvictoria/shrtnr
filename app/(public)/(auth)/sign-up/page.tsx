import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a free shrten account to shorten URLs, track analytics, and manage your links.",
  robots: { index: false, follow: false },
};
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { SignUpForm } from "@/components/sign-up-form";
import { authEntryHref, resolveAuthCallback } from "@/lib/auth-redirect";

export default async function SignUpPage({
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
          <h1 className="dispatch-auth-ticket__title">Create an account</h1>
          <p className="dispatch-auth-ticket__code">ACCESS / NEW OPERATOR</p>
          <CardDescription>Create your credentials to start managing short links.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Suspense>
            <SignUpForm />
          </Suspense>

          <p className="dispatch-auth-switch text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href={authEntryHref("/sign-in", destination)}
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
      <aside className="dispatch-auth-context" aria-label="Account workflow">
        <h2>Turn one short link into a working ledger.</h2>
        <p className="dispatch-auth-context__mark">shrten / new operator</p>
        <p>
          Create an account to keep links together, understand their traffic, and share ownership with a team.
        </p>
        <ol>
          <li><span>01</span> Create your account</li>
          <li><span>02</span> Add or claim links</li>
          <li><span>03</span> Organize the work</li>
        </ol>
      </aside>
    </div>
  );
}
