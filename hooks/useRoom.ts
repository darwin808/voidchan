"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Room } from "@/lib/types";

export function useRoom(slug: string) {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useRef(createClient()).current;

  useEffect(() => {
    let heartbeatInterval: ReturnType<typeof setInterval>;

    async function upsertRoom() {
      // Try to find existing room first
      const { data: existing } = await supabase
        .from("rooms")
        .select("*")
        .eq("slug", slug)
        .single();

      if (existing) {
        // Update last_activity_at
        await supabase
          .from("rooms")
          .update({ last_activity_at: new Date().toISOString() })
          .eq("id", existing.id);
        setRoom(existing);
      } else {
        // Create new room
        const { data: created } = await supabase
          .from("rooms")
          .insert({ slug })
          .select()
          .single();
        if (created) setRoom(created);
      }
      setLoading(false);

      // Heartbeat every 5 minutes
      heartbeatInterval = setInterval(async () => {
        if (existing?.id || room?.id) {
          await supabase
            .from("rooms")
            .update({ last_activity_at: new Date().toISOString() })
            .eq("slug", slug);
        }
      }, 5 * 60 * 1000);
    }

    upsertRoom();

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    };
  }, [slug, supabase]);

  return { room, loading };
}
