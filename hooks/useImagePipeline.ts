"use client";

import { useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { resizeImage } from "@/lib/image/resize";
import { generateBlurhash } from "@/lib/image/blurhash";
import type { Item, ItemType } from "@/lib/types";

interface UseImagePipelineOptions {
  roomId: string | null;
  sessionId: string;
  addItem: (
    type: ItemType,
    x: number,
    y: number,
    overrides?: Partial<Item>
  ) => Promise<Item | null>;
  updateItem: (id: string, updates: Partial<Item>) => Promise<void>;
}

export function useImagePipeline({
  roomId,
  sessionId,
  addItem,
  updateItem,
}: UseImagePipelineOptions) {
  const supabase = useRef(createClient()).current;

  const processAndUpload = useCallback(
    async (file: File, x: number, y: number) => {
      if (!roomId) return;

      const isImage = file.type.startsWith("image/");

      if (isImage) {
        // Image pipeline: resize → blurhash → insert → upload → update URL
        const resized = await resizeImage(file);
        const blurhash = await generateBlurhash(resized);

        // Get image dimensions for the item
        const bitmap = await createImageBitmap(resized);
        const width = Math.min(bitmap.width, 400);
        const height = Math.min(bitmap.height, 400);
        const aspectRatio = bitmap.width / bitmap.height;
        const finalWidth = width;
        const finalHeight = finalWidth / aspectRatio;
        bitmap.close();

        // Insert with blurhash immediately (optimistic)
        const item = await addItem("image", x, y, {
          blurhash,
          file_name: file.name,
          file_size: resized.size,
          mime_type: "image/webp",
          width: finalWidth,
          height: finalHeight,
        });

        if (!item) return;

        // Upload to storage
        const path = `${roomId}/${item.id}.webp`;
        const { error: uploadError } = await supabase.storage
          .from("room-files")
          .upload(path, resized, {
            contentType: "image/webp",
            upsert: true,
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          return;
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("room-files").getPublicUrl(path);

        // Update item with the real URL
        await updateItem(item.id, { content: publicUrl });
      } else {
        // Non-image file
        const path = `${roomId}/${crypto.randomUUID()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("room-files")
          .upload(path, file, {
            contentType: file.type,
            upsert: true,
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          return;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("room-files").getPublicUrl(path);

        await addItem("file", x, y, {
          content: publicUrl,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          width: 250,
          height: 80,
        });
      }
    },
    [roomId, sessionId, supabase, addItem, updateItem]
  );

  return { processAndUpload };
}
