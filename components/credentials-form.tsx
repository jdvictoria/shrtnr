"use client";

import { useRef, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithCredentials } from "@/lib/auth-actions";

export function CredentialsForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const emailRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await signInWithCredentials(email, password, callbackUrl);
      if (result?.error) {
        setError(result.error);
        requestAnimationFrame(() => emailRef.current?.focus());
      }
      // On success the server action throws NEXT_REDIRECT — no explicit navigation needed
    });
  }

  return (
    <form onSubmit={handleSubmit} className="dispatch-access-form" aria-busy={isPending}>
      <div className="dispatch-access-row">
        <Label htmlFor="email">Email</Label>
        <Input
          ref={emailRef}
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          required
          disabled={isPending}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "sign-in-error" : undefined}
        />
      </div>
      <div className="dispatch-access-row">
        <Label htmlFor="password">Password</Label>
        <div className="dispatch-password-control relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(null);
            }}
            required
            disabled={isPending}
            className="pr-12"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "sign-in-error" : "sign-in-recovery"}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="dispatch-password-toggle absolute right-0 top-1/2 inline-flex -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="dispatch-form-feedback" aria-live="polite">
        {error ? (
          <p id="sign-in-error" className="dispatch-form-error" role="alert">
            {error}
          </p>
        ) : (
          <p id="sign-in-recovery" className="dispatch-form-guidance">
            Trouble signing in? Recheck your email and password, then try again.
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="dispatch-commit-action w-full"
        disabled={isPending}
        aria-busy={isPending}
      >
        {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
        {isPending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
