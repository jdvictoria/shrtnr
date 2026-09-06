"use client";

import dynamic from "next/dynamic";

function VisualizationPlaceholder({ height }: { height: number }) {
  return (
    <div
      className="grid place-items-center border border-dashed border-border bg-muted/30 font-mono text-xs uppercase tracking-[0.06em] text-muted-foreground"
      style={{ height }}
      role="status"
    >
      Loading visualization…
    </div>
  );
}

const AnalyticsChart = dynamic(
  () => import("@/components/analytics-chart").then((module) => module.AnalyticsChart),
  { ssr: false, loading: () => <VisualizationPlaceholder height={220} /> }
);

const BreakdownPie = dynamic(
  () => import("@/components/breakdown-pie").then((module) => module.BreakdownPie),
  { ssr: false, loading: () => <VisualizationPlaceholder height={260} /> }
);

const CountryMap = dynamic(
  () => import("@/components/country-map").then((module) => module.CountryMap),
  { ssr: false, loading: () => <VisualizationPlaceholder height={400} /> }
);

export function LazyAnalyticsChart({ data }: { data: { date: string; clicks: number }[] }) {
  return <AnalyticsChart data={data} />;
}

export function LazyBreakdownPie({ items }: { items: { name: string; count: number }[] }) {
  return <BreakdownPie items={items} />;
}

export function LazyCountryMap({ data }: { data: { name: string; count: number }[] }) {
  return <CountryMap data={data} />;
}
