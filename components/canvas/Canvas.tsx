"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { useRoom } from "@/hooks/useRoom";
import { useSessionId } from "@/hooks/useSessionId";
import { useRealtimeItems } from "@/hooks/useRealtimeItems";
import { useCanvas } from "@/hooks/useCanvas";
import { useImagePipeline } from "@/hooks/useImagePipeline";
import { screenToCanvas } from "@/lib/canvas/math";
import { CanvasViewport } from "./CanvasViewport";
import { CanvasItem } from "./CanvasItem";
import { Taskbar } from "@/components/taskbar/Taskbar";
import { createClient } from "@/lib/supabase/client";

interface CanvasProps {
  slug: string;
}

export function Canvas({ slug }: CanvasProps) {
  const { room, loading } = useRoom(slug);
  const sessionId = useSessionId();
  const { items, addItem, updateItem, updateItemLocal, deleteItem, bringToFront } =
    useRealtimeItems(room?.id ?? null, sessionId);
  const {
    state: canvasState,
    startPan,
    onPointerMove: canvasPointerMove,
    onPointerUp: canvasPointerUp,
    onWheel,
    startDrag,
    getDragPosition,
  } = useCanvas();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [connectedCount, setConnectedCount] = useState(1);
  const [dragItemId, setDragItemId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { processAndUpload } = useImagePipeline({
    roomId: room?.id ?? null,
    sessionId,
    addItem,
    updateItem,
  });

  // Presence channel for connected count
  useEffect(() => {
    if (!room?.id) return;

    const supabase = createClient();
    const channel = supabase.channel(`presence-${room.id}`, {
      config: { presence: { key: sessionId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setConnectedCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ session_id: sessionId });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room?.id, sessionId]);

  // Paste handler
  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      if (!room?.id) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) continue;

          // Place at center of viewport
          const cx = window.innerWidth / 2;
          const cy = window.innerHeight / 2;
          const pos = screenToCanvas(
            cx,
            cy,
            canvasState.offsetX,
            canvasState.offsetY,
            canvasState.scale
          );
          processAndUpload(file, pos.x, pos.y);
          break;
        }
      }
    }

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [room?.id, canvasState, processAndUpload]);

  // Drop handler
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !room?.id) return;

    function handleDragOver(e: DragEvent) {
      e.preventDefault();
    }

    function handleDrop(e: DragEvent) {
      e.preventDefault();
      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const pos = screenToCanvas(
        e.clientX,
        e.clientY,
        canvasState.offsetX,
        canvasState.offsetY,
        canvasState.scale
      );

      for (const file of files) {
        processAndUpload(file, pos.x, pos.y);
      }
    }

    container.addEventListener("dragover", handleDragOver);
    container.addEventListener("drop", handleDrop);
    return () => {
      container.removeEventListener("dragover", handleDragOver);
      container.removeEventListener("drop", handleDrop);
    };
  }, [room?.id, canvasState, processAndUpload]);

  // Keyboard handler for delete
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        selectedId &&
        (e.key === "Delete" || e.key === "Backspace") &&
        !(e.target as HTMLElement).isContentEditable
      ) {
        deleteItem(selectedId);
        setSelectedId(null);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, deleteItem]);

  // Double click → new text item
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!room?.id) return;
      const pos = screenToCanvas(
        e.clientX,
        e.clientY,
        canvasState.offsetX,
        canvasState.offsetY,
        canvasState.scale
      );
      addItem("text", pos.x, pos.y, { content: "" });
    },
    [room?.id, canvasState, addItem]
  );

  // New text at center
  const handleNewText = useCallback(() => {
    if (!room?.id) return;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const pos = screenToCanvas(
      cx,
      cy,
      canvasState.offsetX,
      canvasState.offsetY,
      canvasState.scale
    );
    addItem("text", pos.x, pos.y, { content: "" });
  }, [room?.id, canvasState, addItem]);

  // Upload button
  const handleUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || !room?.id) return;

      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const pos = screenToCanvas(
        cx,
        cy,
        canvasState.offsetX,
        canvasState.offsetY,
        canvasState.scale
      );

      for (const file of files) {
        processAndUpload(file, pos.x, pos.y);
      }

      e.target.value = "";
    },
    [room?.id, canvasState, processAndUpload]
  );

  // Title bar drag handler
  const handleTitleBarPointerDown = useCallback(
    (
      e: React.PointerEvent,
      itemId: string,
      itemX: number,
      itemY: number
    ) => {
      setDragItemId(itemId);
      startDrag(itemId, e.pointerId, e.clientX, e.clientY, itemX, itemY);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [startDrag]
  );

  // Pointer move: either pan or drag item
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragItemId && canvasState.mode === "dragging") {
        const pos = getDragPosition(e.clientX, e.clientY);
        if (pos) {
          // Local only — no DB write during drag
          updateItemLocal(dragItemId, { x: pos.x, y: pos.y });
        }
      } else {
        canvasPointerMove(e);
      }
    },
    [dragItemId, canvasState.mode, getDragPosition, updateItemLocal, canvasPointerMove]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (dragItemId) {
        // Persist final position to DB on drop
        const pos = getDragPosition(e.clientX, e.clientY);
        if (pos) {
          updateItem(dragItemId, { x: pos.x, y: pos.y });
        }
      }
      setDragItemId(null);
      canvasPointerUp();
    },
    [dragItemId, getDragPosition, updateItem, canvasPointerUp]
  );

  // Canvas background pointer down → start pan or deselect
  const handleCanvasPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button === 0) {
        setSelectedId(null);
        startPan(e);
      }
    },
    [startPan]
  );

  if (loading) {
    return (
      <div className="landing-desktop">
        <div className="window" style={{ minWidth: 200, textAlign: "center" }}>
          <div className="title-bar">
            <div className="title-bar-text">Loading...</div>
          </div>
          <div className="window-body" style={{ padding: 24 }}>
            <p>Connecting to room...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className={`canvas-container ${canvasState.mode === "panning" ? "panning" : ""}`}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={onWheel}
        onDoubleClick={handleDoubleClick}
      >
        <CanvasViewport
          offsetX={canvasState.offsetX}
          offsetY={canvasState.offsetY}
          scale={canvasState.scale}
        >
          {items.map((item) => (
            <CanvasItem
              key={item.id}
              item={item}
              sessionId={sessionId}
              selected={selectedId === item.id}
              onDelete={deleteItem}
              onUpdate={updateItem}
              onTitleBarPointerDown={handleTitleBarPointerDown}
              onSelect={setSelectedId}
              onBringToFront={bringToFront}
            />
          ))}
        </CanvasViewport>

        {items.length === 0 && (
          <div className="empty-state">
            Double-click to add text or Ctrl+V to paste an image
          </div>
        )}
      </div>

      <Taskbar
        onNewText={handleNewText}
        onUpload={handleUpload}
        connectedCount={connectedCount}
        slug={slug}
      />

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,*/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </>
  );
}
