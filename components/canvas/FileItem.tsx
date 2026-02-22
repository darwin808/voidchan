"use client";

import type { Item } from "@/lib/types";

interface FileItemProps {
  item: Item;
}

function formatFileSize(bytes: number | null): string {
  if (bytes === null) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileItem({ item }: FileItemProps) {
  return (
    <a
      href={item.content || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="file-item-body"
      style={{ textDecoration: "none", color: "inherit" }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="file-icon">📄</div>
      <div className="file-info">
        <div className="file-name">{item.file_name || "Unknown file"}</div>
        <div className="file-size">{formatFileSize(item.file_size)}</div>
      </div>
    </a>
  );
}
