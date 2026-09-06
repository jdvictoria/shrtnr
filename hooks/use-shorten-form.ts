"use client";

import { useReducer, useEffect, useTransition } from "react";
import { shortenUrl } from "@/lib/actions";
import { toast } from "sonner";
import type { GeoRule } from "@/components/geo-rules-input";
import { localDateTimeToIso } from "@/lib/datetime";

export type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid";

type State = {
  url: string;
  customSlug: string;
  expiresAt: string;
  password: string;
  showPassword: boolean;
  geoRules: GeoRule[];
  slugStatus: SlugStatus;
  result: { slug: string } | null;
  copied: boolean;
  showAdvanced: boolean;
};

type Action =
  | { type: "PATCH"; payload: Partial<State> }
  | { type: "SUBMIT_SUCCESS"; payload: { slug: string } }
  | { type: "RESET" };

const initial: State = {
  url: "",
  customSlug: "",
  expiresAt: "",
  password: "",
  showPassword: false,
  geoRules: [],
  slugStatus: "idle",
  result: null,
  copied: false,
  showAdvanced: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "PATCH":         return { ...state, ...action.payload };
    case "SUBMIT_SUCCESS": return { ...initial, result: action.payload };
    case "RESET":          return initial;
  }
}

export function useShortenForm(appUrl: string) {
  const [state, dispatch] = useReducer(reducer, initial);
  const [isPending, startTransition] = useTransition();

  const appDomain = appUrl.replace(/^https?:\/\//, "");
  const shortUrl = state.result ? `${appUrl}/${state.result.slug}` : "";

  // Debounced slug availability check
  useEffect(() => {
    const slug = state.customSlug;
    if (!slug.trim()) {
      dispatch({ type: "PATCH", payload: { slugStatus: "idle" } });
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(slug) || slug.length < 2 || slug.length > 50) {
      dispatch({ type: "PATCH", payload: { slugStatus: "invalid" } });
      return;
    }
    dispatch({ type: "PATCH", payload: { slugStatus: "checking" } });
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/check-slug?slug=${encodeURIComponent(slug)}`);
        const { available } = (await res.json()) as { available: boolean };
        dispatch({ type: "PATCH", payload: { slugStatus: available ? "available" : "taken" } });
      } catch {
        dispatch({ type: "PATCH", payload: { slugStatus: "idle" } });
      }
    }, 400);
    return () => clearTimeout(t);
  }, [state.customSlug]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!state.url.trim() || state.slugStatus === "taken" || state.slugStatus === "invalid") return;
    const expiry = state.expiresAt
      ? (localDateTimeToIso(state.expiresAt) ?? undefined)
      : undefined;
    if (state.expiresAt && !expiry) {
      toast.error("Enter a valid expiration date");
      return;
    }
    startTransition(async () => {
      const res = await shortenUrl(
        state.url.trim(),
        state.customSlug.trim() || undefined,
        expiry,
        state.password.trim() || undefined,
        state.geoRules.filter((r) => r.country && r.url),
      );
      if (!res.success) { toast.error(res.error); return; }
      dispatch({ type: "SUBMIT_SUCCESS", payload: { slug: res.data.slug } });
      toast.success("URL shortened!");
    });
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(shortUrl);
    dispatch({ type: "PATCH", payload: { copied: true } });
    toast.success("Copied!");
    setTimeout(() => dispatch({ type: "PATCH", payload: { copied: false } }), 2000);
  }

  return { state, dispatch, isPending, appDomain, shortUrl, handleSubmit, handleCopy };
}
