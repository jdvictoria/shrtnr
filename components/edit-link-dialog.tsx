"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Pencil, X } from "lucide-react";
import { editLink } from "@/lib/actions";
import { toast } from "sonner";
import { localDateTimeToIso, toDateTimeLocalValue } from "@/lib/datetime";

type Tag = { id: string; name: string; color: string };
type Folder = { id: string; name: string; color: string };

interface EditLinkDialogProps {
  link: {
    id: string;
    url: string;
    notes?: string | null;
    folderId?: string | null;
    expiresAt?: Date | null;
    tags?: { tag: Tag }[];
  };
  folders: Folder[];
  tags: Tag[];
  /** When provided, the dialog is controlled externally (no built-in trigger rendered) */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSaved?: (updated: {
    url: string;
    notes: string | null;
    folderId: string | null;
    tagIds: string[];
    expiresAt: Date | null;
  }) => void;
}

export function EditLinkDialog({
  link,
  folders,
  tags,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onSaved,
}: EditLinkDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? (v: boolean) => controlledOnOpenChange?.(v)
    : setInternalOpen;
  const [url, setUrl] = useState(link.url);
  const [notes, setNotes] = useState(link.notes ?? "");
  const [folderId, setFolderId] = useState<string>(link.folderId ?? "");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    (link.tags ?? []).map((t) => t.tag.id)
  );
  const [expiresAt, setExpiresAt] = useState(
    link.expiresAt
      ? toDateTimeLocalValue(link.expiresAt)
      : ""
  );
  const [isPending, startTransition] = useTransition();

  function toggleTag(id: string) {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  function handleSave() {
    const normalizedExpiry = expiresAt ? localDateTimeToIso(expiresAt) : null;
    if (expiresAt && !normalizedExpiry) {
      toast.error("Enter a valid expiration date");
      return;
    }
    startTransition(async () => {
      const res = await editLink(link.id, {
        url: url.trim() || undefined,
        notes: notes.trim() || undefined,
        folderId: folderId || null,
        tagIds: selectedTagIds,
        expiresAt: normalizedExpiry,
      });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success("Link updated");
      onSaved?.({
        url: url.trim(),
        notes: notes.trim() || null,
        folderId: folderId || null,
        tagIds: selectedTagIds,
        expiresAt: res.data.expiresAt,
      });
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Edit link">
            <Pencil className="h-4 w-4" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Link</DialogTitle>
          <DialogDescription>
            Update the destination URL, organization and expiration.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-url">Destination URL</Label>
            <Input
              id="edit-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-notes">
              Notes{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes about this link..."
              rows={2}
              className="w-full rounded-none border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          {folders.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="edit-folder">Folder</Label>
              <select
                id="edit-folder"
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="w-full rounded-none border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">No folder</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {tags.length > 0 && (
            <div className="space-y-1.5">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => {
                  const selected = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      aria-pressed={selected}
                      className={`inline-flex items-center gap-1 rounded-none px-2.5 py-0.5 font-mono text-xs font-medium border transition-colors ${
                        selected
                          ? "border-transparent text-white"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                      style={selected ? { backgroundColor: tag.color } : {}}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          backgroundColor: selected ? "white" : tag.color,
                        }}
                      />
                      {tag.name}
                      {selected && <X className="h-3 w-3 ml-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="edit-expires">
              Expiration{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Input
              id="edit-expires"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={toDateTimeLocalValue(new Date(Date.now() + 60_000))}
            />
            {expiresAt && (
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setExpiresAt("")}
                aria-label="Clear expiration date"
              >
                Remove expiration
              </button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending || !url.trim()}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
