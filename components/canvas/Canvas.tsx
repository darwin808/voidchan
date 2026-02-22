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
import { Toolbar, type Tool } from "@/components/toolbar/Toolbar";
import { ZoomControls } from "@/components/toolbar/ZoomControls";
import { TopRight } from "@/components/toolbar/TopRight";
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [connectedCount, setConnectedCount] = useState(1);
  const [dragItemId, setDragItemId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { processAndUpload } = useImagePipeline({
    roomId: room?.id ?? null,
    sessionId,
    addItem,
    updateItem,
  });

  // Keyboard shortcuts for tools
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.target as HTMLElement).isContentEditable) return;

      switch (e.key.toLowerCase()) {
        case "v":
          if (!e.metaKey && !e.ctrlKey) setActiveTool("select");
          break;
        case "h":
          setActiveTool("hand");
          break;
        case "t":
          setActiveTool("text");
          break;
      }

      // Delete selected
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

  // Presence
  useEffect(() => {
    if (!room?.id) return;
    const supabase = createClient();
    const channel = supabase.channel(`presence-${room.id}`, {
      config: { presence: { key: sessionId } },
    });
    channel
      .on("presence", { event: "sync" }, () => {
        setConnectedCount(Object.keys(channel.presenceState()).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") await channel.track({ session_id: sessionId });
      });
    return () => { supabase.removeChannel(channel); };
  }, [room?.id, sessionId]);

  // Paste (Cmd+V)
  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      if (!room?.id) return;
      const clipItems = e.clipboardData?.items;
      if (!clipItems) return;
      for (const item of clipItems) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) continue;
          const cx = window.innerWidth / 2;
          const cy = window.innerHeight / 2;
          const pos = screenToCanvas(cx, cy, canvasState.offsetX, canvasState.offsetY, canvasState.scale);
          processAndUpload(file, pos.x, pos.y);
          break;
        }
      }
    }
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [room?.id, canvasState, processAndUpload]);

  // Copy (Cmd+C)
  useEffect(() => {
    function handleCopy(e: ClipboardEvent) {
      if (!selectedId) return;
      if ((e.target as HTMLElement).isContentEditable) return;
      const selectedItem = items.find((i) => i.id === selectedId);
      if (!selectedItem || selectedItem.type !== "image" || !selectedItem.content) return;
      e.preventDefault();
      fetch(selectedItem.content)
        .then((res) => res.blob())
        .then(() => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            canvas.getContext("2d")!.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
              if (blob) navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
            }, "image/png");
          };
          img.src = selectedItem.content!;
        })
        .catch(() => {});
    }
    document.addEventListener("copy", handleCopy);
    return () => document.removeEventListener("copy", handleCopy);
  }, [selectedId, items]);

  // Drop
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !room?.id) return;
    const onDragOver = (e: DragEvent) => e.preventDefault();
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      const files = e.dataTransfer?.files;
      if (!files) return;
      const pos = screenToCanvas(e.clientX, e.clientY, canvasState.offsetX, canvasState.offsetY, canvasState.scale);
      for (const file of files) processAndUpload(file, pos.x, pos.y);
    };
    el.addEventListener("dragover", onDragOver);
    el.addEventListener("drop", onDrop);
    return () => { el.removeEventListener("dragover", onDragOver); el.removeEventListener("drop", onDrop); };
  }, [room?.id, canvasState, processAndUpload]);

  // Canvas click: text tool places text
  const handleCanvasClick = useCallback(
    async (e: React.MouseEvent) => {
      if (!room?.id || activeTool !== "text") return;
      const pos = screenToCanvas(e.clientX, e.clientY, canvasState.offsetX, canvasState.offsetY, canvasState.scale);
      const item = await addItem("text", pos.x, pos.y, { content: "" });
      if (item) {
        setSelectedId(item.id);
        setEditingId(item.id);
      }
    },
    [room?.id, activeTool, canvasState, addItem]
  );

  const handleDoubleClick = useCallback(
    async (e: React.MouseEvent) => {
      if (!room?.id) return;
      const pos = screenToCanvas(e.clientX, e.clientY, canvasState.offsetX, canvasState.offsetY, canvasState.scale);
      const item = await addItem("text", pos.x, pos.y, { content: "" });
      if (item) {
        setSelectedId(item.id);
        setEditingId(item.id);
      }
    },
    [room?.id, canvasState, addItem]
  );

  const handleUpload = useCallback(() => fileInputRef.current?.click(), []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || !room?.id) return;
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const pos = screenToCanvas(cx, cy, canvasState.offsetX, canvasState.offsetY, canvasState.scale);
      for (const file of files) processAndUpload(file, pos.x, pos.y);
      e.target.value = "";
    },
    [room?.id, canvasState, processAndUpload]
  );

  // Item drag
  const handleItemDragStart = useCallback(
    (e: React.PointerEvent, itemId: string, itemX: number, itemY: number) => {
      setDragItemId(itemId);
      startDrag(itemId, e.pointerId, e.clientX, e.clientY, itemX, itemY);
    },
    [startDrag]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragItemId && canvasState.mode === "dragging") {
        const pos = getDragPosition(e.clientX, e.clientY);
        if (pos) updateItemLocal(dragItemId, { x: pos.x, y: pos.y });
      } else {
        canvasPointerMove(e);
      }
    },
    [dragItemId, canvasState.mode, getDragPosition, updateItemLocal, canvasPointerMove]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (dragItemId) {
        const pos = getDragPosition(e.clientX, e.clientY);
        if (pos) updateItem(dragItemId, { x: pos.x, y: pos.y });
      }
      setDragItemId(null);
      canvasPointerUp();
    },
    [dragItemId, getDragPosition, updateItem, canvasPointerUp]
  );

  const handleCanvasPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button === 0) {
        setSelectedId(null);
        setEditingId(null);
        startPan(e);
      }
    },
    [startPan]
  );

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const newScale = Math.min(5, canvasState.scale * 1.25);
    const ratio = newScale / canvasState.scale;
    // We need to use setState directly... just trigger a synthetic wheel
    // Actually let's just update via the canvas state
  }, [canvasState]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Connecting...</p>
      </div>
    );
  }

  const cursorClass =
    activeTool === "hand"
      ? canvasState.mode === "panning" ? "cursor-grabbing" : "cursor-grab"
      : activeTool === "text"
        ? "cursor-text"
        : "cursor-default";

  return (
    <>
      <div
        ref={containerRef}
        className={`excalidraw-canvas ${cursorClass}`}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={onWheel}
        onClick={handleCanvasClick}
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
              editing={editingId === item.id}
              onDelete={deleteItem}
              onUpdate={updateItem}
              onDragStart={handleItemDragStart}
              onSelect={setSelectedId}
              onStartEditing={setEditingId}
              onBringToFront={bringToFront}
            />
          ))}
        </CanvasViewport>

        {items.length === 0 && (
          <div className="empty-state">
            Double-click to add text · Ctrl+V to paste · Drop files to upload
          </div>
        )}
      </div>

      {/* Floating UI */}
      <Toolbar activeTool={activeTool} onToolChange={setActiveTool} onUpload={handleUpload} />
      <ZoomControls
        scale={canvasState.scale}
        onZoomIn={() => {}}
        onZoomOut={() => {}}
        onReset={() => {}}
      />
      <TopRight connectedCount={connectedCount} slug={slug} />

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
