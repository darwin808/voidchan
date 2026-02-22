"use client";

import type { Item } from "@/lib/types";
import { TextItem } from "./TextItem";
import { ImageItem } from "./ImageItem";
import { FileItem } from "./FileItem";
import { useCallback } from "react";

interface CanvasItemProps {
  item: Item;
  sessionId: string;
  selected: boolean;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Item>) => Promise<void>;
  onTitleBarPointerDown: (
    e: React.PointerEvent,
    itemId: string,
    itemX: number,
    itemY: number
  ) => void;
  onSelect: (id: string) => void;
  onBringToFront: (id: string) => void;
}

function getTitleText(item: Item): string {
  switch (item.type) {
    case "text":
      return "Text";
    case "image":
      return item.file_name ? `Image - ${item.file_name}` : "Image";
    case "file":
      return item.file_name || "File";
  }
}

export function CanvasItem({
  item,
  sessionId,
  selected,
  onDelete,
  onUpdate,
  onTitleBarPointerDown,
  onSelect,
  onBringToFront,
}: CanvasItemProps) {
  const isAuthor = item.author_session_id === sessionId;

  const handleTitleBarDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      onSelect(item.id);
      onBringToFront(item.id);
      onTitleBarPointerDown(e, item.id, item.x, item.y);
    },
    [item.id, item.x, item.y, onTitleBarPointerDown, onSelect, onBringToFront]
  );

  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete(item.id);
    },
    [item.id, onDelete]
  );

  return (
    <div
      className={`canvas-item ${selected ? "selected" : ""}`}
      style={{
        position: "absolute",
        left: item.x,
        top: item.y,
        zIndex: item.z_index,
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect(item.id);
        onBringToFront(item.id);
      }}
    >
      <div className="window" style={{ margin: 0 }}>
        <div className="title-bar" onPointerDown={handleTitleBarDown}>
          <div className="title-bar-text">{getTitleText(item)}</div>
          <div className="title-bar-controls">
            <button aria-label="Close" onClick={handleClose} />
          </div>
        </div>
        <div
          className="window-body"
          style={{
            margin: 0,
            padding: item.type === "image" ? 0 : undefined,
          }}
        >
          {item.type === "text" && (
            <TextItem item={item} isAuthor={isAuthor} onUpdate={onUpdate} />
          )}
          {item.type === "image" && <ImageItem item={item} />}
          {item.type === "file" && <FileItem item={item} />}
        </div>
      </div>
    </div>
  );
}
