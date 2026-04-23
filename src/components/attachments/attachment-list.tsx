import { Paperclip, Download, Trash2 } from "lucide-react";
import type { AttachmentRow } from "@/lib/attachments/actions";

type Props = {
  attachments: AttachmentRow[];
  downloadUrls: Record<string, string>;
  onDelete?: (id: string) => void;
  isDeleting?: string | null;
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function AttachmentList({ attachments, downloadUrls, onDelete, isDeleting }: Props) {
  if (attachments.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="flex items-center gap-1.5 text-sm font-medium text-fg">
        <Paperclip size={14} />
        添付ファイル ({attachments.length})
      </h3>
      <ul className="flex flex-col gap-1">
        {attachments.map((att) => {
          const url = downloadUrls[att.id];
          const isImage = att.mime_type.startsWith("image/");
          return (
            <li
              key={att.id}
              className="flex items-center justify-between rounded-md border border-border bg-bg-elev px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2 truncate text-fg">
                <span>{isImage ? "🖼️" : "📄"}</span>
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:text-accent-hv hover:underline truncate"
                  >
                    {att.file_name}
                  </a>
                ) : (
                  <span className="truncate">{att.file_name}</span>
                )}
                <span className="text-xs text-fg-muted shrink-0">
                  ({formatSize(att.file_size)})
                </span>
              </span>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                {url && (
                  <a
                    href={url}
                    download={att.file_name}
                    className="text-fg-muted hover:text-accent"
                    title="ダウンロード"
                  >
                    <Download size={14} />
                  </a>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(att.id)}
                    disabled={isDeleting === att.id}
                    className="text-fg-muted hover:text-danger disabled:opacity-50"
                    title="削除"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
