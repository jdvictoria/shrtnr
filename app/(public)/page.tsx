import type { Metadata } from "next";
import { ShortenForm } from "@/components/shorten-form";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "shrten — Free URL Shortener",
  description:
    "Shorten any URL in seconds for free. No account required. Track clicks and manage links with shrten.",
  alternates: { canonical: "/" },
};

export default async function Home() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const proto = requestHeaders.get("x-forwarded-proto")?.split(",")[0] ?? "http";
  const appUrl = `${proto}://${host}`;

  return (
    <section className="dispatch-page">
      <div className="dispatch-hero">
        <h1 className="dispatch-headline">
          Pack a long URL
          <br />
          into a link that travels.
        </h1>
        <p className="dispatch-note">No account required.</p>
        <div className="dispatch-hero-seam" aria-hidden="true" />
        <span className="dispatch-register dispatch-register--hero" aria-hidden="true" />
      </div>
      <ShortenForm appUrl={appUrl} />
    </section>
  );
}
