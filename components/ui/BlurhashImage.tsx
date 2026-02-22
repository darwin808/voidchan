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

  // Reset loaded state when src changes
  useEffect(() => {
    setLoaded(false);
  }, [src]);

  return (
    <div style={{ position: "relative", width, height, overflow: "hidden" }}>
      {/* Blurhash canvas — always fills container */}
      {blurhash && (
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        />
      )}
      {/* Real image — fades in over blurhash */}
      {src && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          draggable={false}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            opacity: loaded ? 1 : 0,
            transition: "opacity 300ms ease",
          }}
        />
      )}
    </div>
  );
}
