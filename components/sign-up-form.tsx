"use client";

import { useRef, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpWithCredentials, signInWithCredentials } from "@/lib/auth-actions";

type SignUpField = "name" | "email" | "password";

export function SignUpForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<SignUpField | null>(null);
  const [isPending, startTransition] = useTransition();
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setErrorField(null);
    startTransition(async () => {
      const result = await signUpWithCredentials(name, email, password);
      if (result.error) {
        const field: SignUpField = result.error.toLowerCase().includes("password")
          ? "password"
          : result.error.toLowerCase().includes("email")
            ? "email"
            : "name";
        setError(result.error);
        setErrorField(field);
        requestAnimationFrame(() => {
          ({ name: nameRef, email: emailRef, password: passwordRef })[field].current?.focus();
        });
        return;
      }
      // Immediately sign in after registration
      const signInResult = await signInWithCredentials(email, password, callbackUrl);
      if (signInResult?.error) {
        setError("Account created. Sign in with the credentials you just set.");
        setErrorField("email");
        requestAnimationFrame(() => emailRef.current?.focus());
      }
    });
  }

  function clearError(field: SignUpField) {
    if (errorField === field) {
      setError(null);
      setErrorField(null);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="dispatch-access-form" aria-busy={isPending}>
      <div className="dispatch-access-row">
        <Label htmlFor="name">Name</Label>
        <Input
          ref={nameRef}
          id="name"
          autoComplete="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            clearError("name");
          }}
          required
          disabled={isPending}
          aria-invalid={errorField === "name"}
          aria-describedby={errorField === "name" ? "sign-up-error" : undefined}
        />
      </div>
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
            clearError("email");
          }}
          required
          disabled={isPending}
          aria-invalid={errorField === "email"}
          aria-describedby={errorField === "email" ? "sign-up-error" : undefined}
        />
      </div>
      <div className="dispatch-access-row">
        <Label htmlFor="password">Password</Label>
        <div className="dispatch-password-control relative">
          <Input
            ref={passwordRef}
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearError("password");
            }}
            required
            disabled={isPending}
            className="pr-12"
            aria-invalid={errorField === "password"}
            aria-describedby={errorField === "password" ? "sign-up-error" : "password-requirement"}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="dispatch-password-toggle absolute right-0 top-1/2 inline-flex -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p
          id="password-requirement"
          className="dispatch-access-requirement"
          data-met={password.length >= 8}
        >
          {password.length >= 8 ? "Minimum length met" : "Use at least 8 characters"}
        </p>
      </div>

      <div className="dispatch-form-feedback" aria-live="polite">
        {error ? (
          <p id="sign-up-error" className="dispatch-form-error" role="alert">
            {error}
          </p>
        ) : (
          <p className="dispatch-form-guidance">Your account stores links and their traffic history.</p>
        )}
      </div>

      <Button
        type="submit"
        className="dispatch-commit-action w-full"
        disabled={isPending}
        aria-busy={isPending}
      >
        {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
        {isPending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
