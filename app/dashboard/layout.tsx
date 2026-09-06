import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getFolders } from "@/lib/folder-actions";
import { getTags } from "@/lib/tag-actions";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const [folders, tags] = await Promise.all([getFolders(), getTags()]);

  return (
    <SidebarProvider className="dispatch-app h-svh">
      <DashboardSidebar
        folders={folders}
        tags={tags}
      />
      <SidebarInset className="dispatch-app__main overflow-y-auto">
        {/* Mobile top bar */}
        <header className="dispatch-mobile-bar flex h-14 items-center gap-3 border-b border-border px-4 md:hidden shrink-0">
          <SidebarTrigger />
          <span className="font-semibold">shrten</span>
          <span className="ml-auto font-mono text-[0.62rem] uppercase tracking-[0.08em] text-muted-foreground">Dispatch ledger</span>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
