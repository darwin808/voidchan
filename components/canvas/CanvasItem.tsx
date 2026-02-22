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
  onDragStart: (
    e: React.PointerEvent,
    itemId: string,
    itemX: number,
    itemY: number
  ) => void;
  onSelect: (id: string) => void;
  onBringToFront: (id: string) => void;
}

export function CanvasItem({
  item,
  sessionId,
  selected,
  onDelete,
  onUpdate,
  onDragStart,
  onSelect,
  onBringToFront,
}: CanvasItemProps) {
  const isAuthor = item.author_session_id === sessionId;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      onSelect(item.id);
      onBringToFront(item.id);

      // Don't start drag if clicking inside editable text
      const target = e.target as HTMLElement;
      if (target.isContentEditable || target.closest("[contenteditable]")) {
        return;
      }

      onDragStart(e, item.id, item.x, item.y);
    },
    [item.id, item.x, item.y, onDragStart, onSelect, onBringToFront]
  );

  return (
    <div
      className={`canvas-item ${selected ? "selected" : ""}`}
      style={{
        position: "absolute",
        left: item.x,
        top: item.y,
        zIndex: item.z_index,
        cursor: item.type === "text" ? "default" : "move",
      }}
      onPointerDown={handlePointerDown}
    >
      {item.type === "text" && (
        <TextItem item={item} isAuthor={isAuthor} onUpdate={onUpdate} />
      )}
      {item.type === "image" && <ImageItem item={item} />}
      {item.type === "file" && <FileItem item={item} />}
    </div>
  );
}
