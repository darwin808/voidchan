"use client";

import type { ReactNode } from "react";

interface CanvasViewportProps {
  offsetX: number;
  offsetY: number;
  scale: number;
  children: ReactNode;
}

export function CanvasViewport({
  offsetX,
  offsetY,
  scale,
  children,
}: CanvasViewportProps) {
  return (
    <div
      className="canvas-viewport"
      style={{
        transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
      }}
    >
      {children}
    </div>
  );
}
