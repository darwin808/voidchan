"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { CanvasState } from "@/lib/types";

const MIN_SCALE = 0.1;
const MAX_SCALE = 5;

export function useCanvas() {
  const [state, setState] = useState<CanvasState>({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    mode: "idle",
    dragTargetId: null,
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const panStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const dragStart = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    itemX: number;
    itemY: number;
  } | null>(null);

  const startPan = useCallback((e: React.PointerEvent) => {
    panStart.current = {
      x: e.clientX,
      y: e.clientY,
      ox: stateRef.current.offsetX,
      oy: stateRef.current.offsetY,
    };
    setState((s) => ({ ...s, mode: "panning" }));
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const s = stateRef.current;
    const pan = panStart.current;

    if (s.mode === "panning" && pan) {
      const dx = e.clientX - pan.x;
      const dy = e.clientY - pan.y;
      const ox = pan.ox + dx;
      const oy = pan.oy + dy;
      setState((prev) => ({
        ...prev,
        offsetX: ox,
        offsetY: oy,
      }));
    }
  }, []);

  const onPointerUp = useCallback(() => {
    panStart.current = null;
    dragStart.current = null;
    setState((s) => ({ ...s, mode: "idle", dragTargetId: null }));
  }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const s = stateRef.current;
    const delta = -e.deltaY * 0.001;
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, s.scale * (1 + delta)));

    // Zoom toward cursor position
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    const ratio = newScale / s.scale;

    setState((prev) => ({
      ...prev,
      scale: newScale,
      offsetX: mouseX - (mouseX - prev.offsetX) * ratio,
      offsetY: mouseY - (mouseY - prev.offsetY) * ratio,
    }));
  }, []);

  // Start dragging an item
  const startDrag = useCallback(
    (
      itemId: string,
      pointerId: number,
      clientX: number,
      clientY: number,
      itemX: number,
      itemY: number
    ) => {
      dragStart.current = {
        pointerId,
        startX: clientX,
        startY: clientY,
        itemX,
        itemY,
      };
      setState((s) => ({ ...s, mode: "dragging", dragTargetId: itemId }));
    },
    []
  );

  // Get the drag delta in canvas coordinates
  const getDragPosition = useCallback(
    (clientX: number, clientY: number) => {
      if (!dragStart.current) return null;
      const s = stateRef.current;
      const dx = (clientX - dragStart.current.startX) / s.scale;
      const dy = (clientY - dragStart.current.startY) / s.scale;
      return {
        x: dragStart.current.itemX + dx,
        y: dragStart.current.itemY + dy,
      };
    },
    []
  );

  return {
    state,
    startPan,
    onPointerMove,
    onPointerUp,
    onWheel,
    startDrag,
    getDragPosition,
  };
}
