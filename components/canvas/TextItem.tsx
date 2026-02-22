"use client";

import { useRef, useEffect, useCallback } from "react";
import type { Item } from "@/lib/types";

interface TextItemProps {
  item: Item;
  isAuthor: boolean;
  onUpdate: (id: string, updates: Partial<Item>) => Promise<void>;
}

export function TextItem({ item, isAuthor, onUpdate }: TextItemProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (contentRef.current && contentRef.current.textContent !== item.content) {
      // Only update if not focused (avoid cursor jumping)
      if (document.activeElement !== contentRef.current) {
        contentRef.current.textContent = item.content || "";
      }
    }
  }, [item.content]);

  const handleInput = useCallback(() => {
    if (!isAuthor) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const text = contentRef.current?.textContent || "";
      onUpdate(item.id, { content: text });
    }, 500);
  }, [item.id, isAuthor, onUpdate]);

  return (
    <div
      ref={contentRef}
      className="text-content"
      contentEditable={isAuthor}
      suppressContentEditableWarning
      onInput={handleInput}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {item.content || ""}
    </div>
  );
}
