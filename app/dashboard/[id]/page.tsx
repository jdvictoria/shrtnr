import { notFound } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { ArrowLeft, Clock, ExternalLink } from "lucide-react";
import { getLinkAnalytics } from "@/lib/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LazyAnalyticsChart,
  LazyBreakdownPie,
  LazyCountryMap,
} from "@/components/lazy-analytics";

function BreakdownBar({
  items,
  total,
}: {
  items: { name: string; count: number }[];
  total: number;
}) {
  if (items.length === 0)
    return <p className="text-sm text-muted-foreground py-4 text-center">No data yet.</p>;

  return (
    <div className="space-y-2">
      {items.map(({ name, count }) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={name}>
            <div className="flex items-center justify-between mb-1 text-sm">
              <span className="truncate">{name}</span>
              <span className="ml-3 shrink-0 font-medium">
                {count}{" "}
                <span className="text-muted-foreground font-normal">({pct}%)</span>
              </span>
            </div>
            <div className="h-1.5 overflow-hidden border border-border bg-muted">
              <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default async function LinkAnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ days?: string }>;
}) {
  const { id } = await params;
  const { days: daysParam } = await searchParams;
  const days = daysParam === "7" ? 7 : 30;

  const data = await getLinkAnalytics(id, days);
  if (!data) notFound();

  const { link, clicksByDay, topReferers, topCountries, deviceStats, browserStats, osStats, totalInPeriod } = data;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto")?.split(",")[0] ?? "http";
  const appUrl = `${proto}://${host}`;
  const shortUrl = `${appUrl}/${link.slug}`;
  const isExpired = link.expiresAt && link.expiresAt < new Date();

  return (
    <div className="dispatch-workspace dispatch-workspace--measure">
      {/* Back */}
      <Button variant="ghost" size="sm" asChild className="mb-5">
        <Link href="/dashboard">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
      </Button>

      {/* Header */}
      <div className="dispatch-page-header flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1>/{link.slug}</h1>
            {link.passwordHash && <Badge variant="outline">Password protected</Badge>}
            {isExpired && <Badge variant="destructive">Expired</Badge>}
          </div>
          <p className="dispatch-page-code">LINK ANALYTICS / {days} DAY VIEW</p>
          <a href={link.url} target="_blank" rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:underline flex items-center gap-1 truncate max-w-lg">
            {link.url}
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
            <span>Created {new Date(link.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
            {link.expiresAt && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {isExpired ? "Expired" : "Expires"}{" "}
                {new Date(link.expiresAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </span>
            )}
          </div>
        </div>
        <a href={shortUrl} target="_blank" rel="noopener noreferrer"
          className="text-sm text-primary hover:underline shrink-0">
          {shortUrl.replace(/^https?:\/\//, "")}
        </a>
      </div>

      {/* Stats */}
      <dl className="dispatch-ledger-summary mb-6">
        <div>
          <dt>All-time clicks</dt>
          <dd>{link.clicks}</dd>
        </div>
        <div>
          <dt>Last {days} days</dt>
          <dd>{totalInPeriod}</dd>
        </div>
      </dl>

      {/* Chart */}
      <Card className="dispatch-ledger-panel mb-6">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle>Clicks over time</CardTitle>
            <div className="flex gap-1">
              <Button variant={days === 7 ? "default" : "ghost"} size="sm" className="h-7 px-3 text-xs" asChild>
                <Link href={`/dashboard/${id}?days=7`}>7d</Link>
              </Button>
              <Button variant={days === 30 ? "default" : "ghost"} size="sm" className="h-7 px-3 text-xs" asChild>
                <Link href={`/dashboard/${id}?days=30`}>30d</Link>
              </Button>
            </div>
          </div>
          <CardDescription>
            {totalInPeriod} click{totalInPeriod !== 1 ? "s" : ""} in the last {days} days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LazyAnalyticsChart data={clicksByDay} />
        </CardContent>
      </Card>

      {/* Breakdown tabs */}
      <Tabs defaultValue="country">
        <TabsList className="mb-4">
          <TabsTrigger value="country">Country</TabsTrigger>
          <TabsTrigger value="device">Device</TabsTrigger>
          <TabsTrigger value="browser">Browser</TabsTrigger>
          <TabsTrigger value="os">OS</TabsTrigger>
          <TabsTrigger value="referer">Referer</TabsTrigger>
        </TabsList>

        <Card className="dispatch-ledger-panel">
          <CardContent className="pt-6">
            <TabsContent value="country">
              <LazyCountryMap data={topCountries} />
            </TabsContent>
            <TabsContent value="device">
              <LazyBreakdownPie items={deviceStats} />
            </TabsContent>
            <TabsContent value="browser">
              <LazyBreakdownPie items={browserStats} />
            </TabsContent>
            <TabsContent value="os">
              <LazyBreakdownPie items={osStats} />
            </TabsContent>
            <TabsContent value="referer">
              <BreakdownBar items={topReferers} total={totalInPeriod} />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
