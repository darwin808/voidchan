"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { generateSlug } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Room } from "@/lib/types";

export function LandingWindow() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const supabase = createClient();

  useEffect(() => {
    async function fetchRooms() {
      const { data } = await supabase
        .from("rooms")
        .select("*")
        .order("last_activity_at", { ascending: false })
        .limit(50);
      if (data) setRooms(data);
      setLoading(false);
    }
    fetchRooms();
  }, []);

  const handleCreate = useCallback(async () => {
    const slug = generateSlug();
    const boardName = name.trim() || "Untitled Board";
    await supabase.from("rooms").insert({
      slug,
      name: boardName,
      description: description.trim(),
    });
    router.push(`/r/${slug}`);
  }, [name, description, supabase, router]);

  const handleQuickCreate = useCallback(async () => {
    const slug = generateSlug();
    await supabase.from("rooms").insert({
      slug,
      name: "Untitled Board",
      description: "",
    });
    router.push(`/r/${slug}`);
  }, [supabase, router]);

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  return (
    <div className="landing-page">
      <div className="landing-header">
        <h1 className="landing-title">voidchan</h1>
        <p className="landing-subtitle">
          Drop anything. Share with anyone. Anonymous. Ephemeral.
        </p>
        <div className="landing-actions">
          <button className="btn-primary" onClick={() => setCreating(true)}>
            + New Board
          </button>
          <button className="btn-secondary" onClick={handleQuickCreate}>
            Quick Board
          </button>
        </div>
      </div>

      {/* Create modal */}
      {creating && (
        <div className="modal-overlay" onClick={() => setCreating(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Create Board</h2>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                className="form-input"
                type="text"
                placeholder="My board"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description (optional)</label>
              <input
                className="form-input"
                type="text"
                placeholder="What's this board for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setCreating(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleCreate}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Boards list */}
      <div className="boards-section">
        <h2 className="boards-heading">Active Boards</h2>
        {loading ? (
          <div className="boards-loading">Loading...</div>
        ) : rooms.length === 0 ? (
          <div className="boards-empty">
            No boards yet. Create one to get started.
          </div>
        ) : (
          <div className="boards-grid">
            {rooms.map((room) => (
              <a
                key={room.id}
                href={`/r/${room.slug}`}
                className="board-card"
              >
                <div className="board-card-name">{room.name || "Untitled Board"}</div>
                {room.description && (
                  <div className="board-card-desc">{room.description}</div>
                )}
                <div className="board-card-meta">
                  <span className="board-card-slug">/r/{room.slug}</span>
                  <span className="board-card-time">{timeAgo(room.last_activity_at)}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
