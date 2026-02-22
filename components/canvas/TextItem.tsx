"use client";

import { useRef, useEffect, useCallback } from "react";
import type { Item } from "@/lib/types";

interface TextItemProps {
  item: Item;
  isAuthor: boolean;
  editing: boolean;
  onUpdate: (id: string, updates: Partial<Item>) => Promise<void>;
}

export function TextItem({ item, isAuthor, editing, onUpdate }: TextItemProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (contentRef.current && contentRef.current.textContent !== item.content) {
      if (document.activeElement !== contentRef.current) {
        contentRef.current.textContent = item.content || "";
      }
    }
  }, [item.content]);

  // Focus when entering edit mode
  useEffect(() => {
    if (editing && isAuthor && contentRef.current) {
      contentRef.current.focus();
      // Move cursor to end
      const sel = window.getSelection();
      if (sel && contentRef.current.childNodes.length > 0) {
        sel.selectAllChildren(contentRef.current);
        sel.collapseToEnd();
      }
    }
  }, [editing, isAuthor]);

  const handleInput = useCallback(() => {
    if (!isAuthor) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const text = contentRef.current?.textContent || "";
      onUpdate(item.id, { content: text });
    }, 500);
  }, [item.id, isAuthor, onUpdate]);

  const editable = editing && isAuthor;

  return (
    <div
      ref={contentRef}
      className={`text-content ${editing ? "text-editing" : ""}`}
      contentEditable={editable}
      suppressContentEditableWarning
      onInput={handleInput}
      onPointerDown={(e) => {
        // Only stop propagation if we're in edit mode
        if (editing) e.stopPropagation();
      }}
    >
      {item.content || (editing ? "" : "Text")}
    </div>
  );
}
