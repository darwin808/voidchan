"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Item, ItemType } from "@/lib/types";
import { nanoid } from "nanoid";

export function useRealtimeItems(roomId: string | null, sessionId: string) {
  const [items, setItems] = useState<Map<string, Item>>(new Map());
  const supabase = useRef(createClient()).current;

  // Fetch initial items
  useEffect(() => {
    if (!roomId) return;

    async function fetchItems() {
      const { data } = await supabase
        .from("items")
        .select("*")
        .eq("room_id", roomId)
        .order("z_index", { ascending: true });

      if (data) {
        const map = new Map<string, Item>();
        data.forEach((item: Item) => map.set(item.id, item));
        setItems(map);
      }
    }

    fetchItems();
  }, [roomId, supabase]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "items",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newItem = payload.new as Item;
            setItems((prev) => {
              const next = new Map(prev);
              next.set(newItem.id, newItem);
              return next;
            });
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as Item;
            setItems((prev) => {
              const next = new Map(prev);
              next.set(updated.id, updated);
              return next;
            });
          } else if (payload.eventType === "DELETE") {
            const deleted = payload.old as Item;
            setItems((prev) => {
              const next = new Map(prev);
              next.delete(deleted.id);
              return next;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, supabase]);

  const getMaxZIndex = useCallback(() => {
    let max = 0;
    items.forEach((item) => {
      if (item.z_index > max) max = item.z_index;
    });
    return max;
  }, [items]);

  const addItem = useCallback(
    async (
      type: ItemType,
      x: number,
      y: number,
      overrides: Partial<Item> = {}
    ) => {
      if (!roomId) return null;

      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const zIndex = getMaxZIndex() + 1;

      const newItem: Item = {
        id,
        room_id: roomId,
        type,
        content: null,
        blurhash: null,
        file_name: null,
        file_size: null,
        mime_type: null,
        x,
        y,
        width: 200,
        height: 200,
        z_index: zIndex,
        author_session_id: sessionId,
        created_at: now,
        updated_at: now,
        ...overrides,
      };

      // Optimistic update
      setItems((prev) => {
        const next = new Map(prev);
        next.set(id, newItem);
        return next;
      });

      const { error } = await supabase.from("items").insert(newItem);

      if (error) {
        // Rollback on error
        setItems((prev) => {
          const next = new Map(prev);
          next.delete(id);
          return next;
        });
        return null;
      }

      return newItem;
    },
    [roomId, sessionId, supabase, getMaxZIndex]
  );

  const updateItem = useCallback(
    async (id: string, updates: Partial<Item>) => {
      const existing = items.get(id);
      if (!existing) return;

      const updated = {
        ...existing,
        ...updates,
        updated_at: new Date().toISOString(),
      };

      // Optimistic update
      setItems((prev) => {
        const next = new Map(prev);
        next.set(id, updated);
        return next;
      });

      await supabase
        .from("items")
        .update({ ...updates, updated_at: updated.updated_at })
        .eq("id", id);
    },
    [items, supabase]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      const existing = items.get(id);

      // Optimistic delete
      setItems((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });

      const { error } = await supabase.from("items").delete().eq("id", id);

      if (error && existing) {
        // Rollback
        setItems((prev) => {
          const next = new Map(prev);
          next.set(id, existing);
          return next;
        });
      }
    },
    [items, supabase]
  );

  const bringToFront = useCallback(
    async (id: string) => {
      const zIndex = getMaxZIndex() + 1;
      await updateItem(id, { z_index: zIndex });
    },
    [getMaxZIndex, updateItem]
  );

  return {
    items: Array.from(items.values()).sort((a, b) => a.z_index - b.z_index),
    addItem,
    updateItem,
    deleteItem,
    bringToFront,
  };
}
