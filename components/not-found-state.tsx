import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotFoundState() {
  return (
    <div className="dispatch-status-page">
      <section className="dispatch-status-ticket" aria-labelledby="not-found-title">
        <SearchX className="dispatch-status-ticket__icon" aria-hidden="true" />
        <h1 id="not-found-title">Link not found</h1>
        <p className="dispatch-auth-ticket__code">ROUTE STATUS / 404</p>
        <p>This short link doesn&apos;t exist or has been removed.</p>
        <Button asChild className="dispatch-commit-action">
          <Link href="/">Return to shrten</Link>
        </Button>
      </section>
    </div>
  );
}
