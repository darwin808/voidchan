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
  editing: boolean;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Item>) => Promise<void>;
  onDragStart: (
    e: React.PointerEvent,
    itemId: string,
    itemX: number,
    itemY: number
  ) => void;
  onSelect: (id: string) => void;
  onStartEditing: (id: string) => void;
  onBringToFront: (id: string) => void;
}

export function CanvasItem({
  item,
  sessionId,
  selected,
  editing,
  onDelete,
  onUpdate,
  onDragStart,
  onSelect,
  onStartEditing,
  onBringToFront,
}: CanvasItemProps) {
  const isAuthor = item.author_session_id === sessionId;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      onSelect(item.id);
      onBringToFront(item.id);

      // If already editing text, don't start drag
      if (editing && item.type === "text") return;

      onDragStart(e, item.id, item.x, item.y);
    },
    [item.id, item.x, item.y, item.type, editing, onDragStart, onSelect, onBringToFront]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (item.type === "text" && isAuthor) {
        onStartEditing(item.id);
      }
    },
    [item.id, item.type, isAuthor, onStartEditing]
  );

  return (
    <div
      className={`canvas-item ${selected ? "selected" : ""}`}
      style={{
        position: "absolute",
        left: item.x,
        top: item.y,
        zIndex: item.z_index,
        cursor: editing ? "text" : "move",
      }}
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
    >
      {item.type === "text" && (
        <TextItem item={item} isAuthor={isAuthor} editing={editing} onUpdate={onUpdate} />
      )}
      {item.type === "image" && <ImageItem item={item} />}
      {item.type === "file" && <FileItem item={item} />}
    </div>
  );
}
