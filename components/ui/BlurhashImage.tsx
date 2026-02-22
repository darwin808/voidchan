"use client";

import { useRef, useEffect, useState } from "react";
import { decode } from "blurhash";

interface BlurhashImageProps {
  blurhash: string | null;
  src: string | null;
  alt?: string;
  width?: number;
  height?: number;
}

export function BlurhashImage({
  blurhash,
  src,
  alt = "",
  width = 200,
  height = 200,
}: BlurhashImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!blurhash || !canvasRef.current) return;

    try {
      const pixels = decode(blurhash, 32, 32);
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;

      canvasRef.current.width = 32;
      canvasRef.current.height = 32;
      const imageData = ctx.createImageData(32, 32);
      imageData.data.set(pixels);
      ctx.putImageData(imageData, 0, 0);
    } catch {
      // Invalid blurhash, ignore
    }
  }, [blurhash]);

  return (
    <div className="blurhash-container" style={{ width, height }}>
      {blurhash && <canvas ref={canvasRef} />}
      {src && (
        <img
          src={src}
          alt={alt}
          className={loaded ? "loaded" : ""}
          onLoad={() => setLoaded(true)}
          draggable={false}
        />
      )}
    </div>
  );
}
