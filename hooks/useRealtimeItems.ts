"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Item, ItemType } from "@/lib/types";

export function useRealtimeItems(roomId: string | null, sessionId: string) {
  const [items, setItems] = useState<Map<string, Item>>(new Map());
  const itemsRef = useRef(items);
  itemsRef.current = items;
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
    itemsRef.current.forEach((item) => {
      if (item.z_index > max) max = item.z_index;
    });
    return max;
  }, []);

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
      const updatedAt = new Date().toISOString();

      // Optimistic update using functional setState (no stale closure)
      setItems((prev) => {
        const existing = prev.get(id);
        if (!existing) return prev;
        const next = new Map(prev);
        next.set(id, { ...existing, ...updates, updated_at: updatedAt });
        return next;
      });

      // Always send the DB update
      await supabase
        .from("items")
        .update({ ...updates, updated_at: updatedAt })
        .eq("id", id);
    },
    [supabase]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      // Optimistic delete
      setItems((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });

      const { error } = await supabase.from("items").delete().eq("id", id);

      if (error) {
        // Rollback by refetching — we lost the reference
        const { data } = await supabase
          .from("items")
          .select("*")
          .eq("id", id)
          .single();
        if (data) {
          setItems((prev) => {
            const next = new Map(prev);
            next.set(id, data);
            return next;
          });
        }
      }
    },
    [supabase]
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
