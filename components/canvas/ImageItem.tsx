"use client";

import type { Item } from "@/lib/types";
import { BlurhashImage } from "@/components/ui/BlurhashImage";

interface ImageItemProps {
  item: Item;
}

export function ImageItem({ item }: ImageItemProps) {
  return (
    <div className="image-item-body">
      <BlurhashImage
        blurhash={item.blurhash}
        src={item.content}
        alt={item.file_name || "Image"}
        width={item.width}
        height={item.height}
      />
    </div>
  );
}
