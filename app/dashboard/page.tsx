import { auth } from "@/auth";
import { LinksTable } from "@/components/links-table";
import { BulkUpload } from "@/components/bulk-upload";
import { AddLinkDialog } from "@/components/add-link-dialog";
import { getLinks, getStats } from "@/lib/actions";
import { LINKS_PAGE_SIZE } from "@/lib/utils";
import { getFolders } from "@/lib/folder-actions";
import { getTags } from "@/lib/tag-actions";
import { headers } from "next/headers";

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ folderId?: string; archived?: string; tagId?: string; page?: string }>;
}) {
  const session = await auth();

  const { folderId, archived, tagId, page: pageParam } = await searchParams;
  const showArchived = archived === "1";
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const [{ links, total }, stats, folders, tags] = await Promise.all([
    getLinks({ archived: showArchived, folderId, tagId, page, pageSize: LINKS_PAGE_SIZE }),
    getStats(),
    getFolders(),
    getTags(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / LINKS_PAGE_SIZE));
  const avgClicks =
    stats.totalLinks > 0 ? (stats.totalClicks / stats.totalLinks).toFixed(1) : "0";

  const folderProps = folders.map(({ id, name, color }) => ({ id, name, color }));
  const tagProps = tags.map(({ id, name, color }) => ({ id, name, color }));
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const proto = requestHeaders.get("x-forwarded-proto")?.split(",")[0] ?? "http";
  const appUrl = `${proto}://${host}`;

  return (
    <div className="dispatch-workspace">
      {/* Header */}
      <div className="dispatch-page-header flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1>Link ledger</h1>
          <p className="dispatch-page-code">LINK OPERATIONS / PERSONAL</p>
          <p className="text-muted-foreground text-sm mt-2">
            Signed in as {session?.user?.name ?? session?.user?.email}
          </p>
        </div>
        <div className="flex items-center gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">
          <BulkUpload />
          <AddLinkDialog folders={folderProps} appUrl={appUrl} />
        </div>
      </div>

      {/* Stats */}
      <dl className="dispatch-ledger-summary">
        <div>
          <dt>Total links</dt>
          <dd>{stats.totalLinks}</dd>
        </div>
        <div>
          <dt>Total clicks</dt>
          <dd>{stats.totalClicks}</dd>
        </div>
        <div>
          <dt>Average clicks per link</dt>
          <dd>{avgClicks}</dd>
        </div>
      </dl>

      {/* Links table */}
      <LinksTable
        key={`${showArchived ? "archived" : "active"}-${folderId ?? ""}-${tagId ?? ""}-${page}`}
        links={links}
        folders={folderProps}
        tags={tagProps}
        showArchived={showArchived}
        page={page}
        totalPages={totalPages}
        total={total}
        appUrl={appUrl}
      />

    </div>
  );
}
