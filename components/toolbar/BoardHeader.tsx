"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Room } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

interface BoardHeaderProps {
  room: Room;
}

export function BoardHeader({ room }: BoardHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(room.name || "Untitled Board");
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    setName(room.name || "Untitled Board");
  }, [room.name]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const save = useCallback(async () => {
    setEditing(false);
    const trimmed = name.trim() || "Untitled Board";
    setName(trimmed);
    if (trimmed !== room.name) {
      await supabase.from("rooms").update({ name: trimmed }).eq("id", room.id);
    }
  }, [name, room.id, room.name, supabase]);

  return (
    <div className="board-header">
      {editing ? (
        <input
          ref={inputRef}
          className="board-header-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") { setName(room.name || "Untitled Board"); setEditing(false); }
          }}
        />
      ) : (
        <button className="board-header-name" onClick={() => setEditing(true)} title="Click to rename">
          {name}
        </button>
      )}
    </div>
  );
}
