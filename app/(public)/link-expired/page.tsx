import Link from "next/link";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LinkExpired() {
  return (
    <div className="dispatch-status-page">
      <section className="dispatch-status-ticket">
        <Clock className="dispatch-status-ticket__icon" />
        <h1>Link expired</h1>
        <p className="dispatch-auth-ticket__code">ROUTE STATUS / 410</p>
        <p>This short link has passed its expiration date and is no longer active.</p>
        <Button asChild className="dispatch-commit-action">
          <Link href="/">Create a new link</Link>
        </Button>
      </section>
    </div>
  );
}
