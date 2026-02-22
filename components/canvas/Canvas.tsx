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
import { PaintMenuBar } from "@/components/paint/PaintMenuBar";
import { PaintToolbox, type PaintTool } from "@/components/paint/PaintToolbox";
import { PaintStatusBar } from "@/components/paint/PaintStatusBar";
import { PaintColorPalette } from "@/components/paint/PaintColorPalette";
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
  const [activeTool, setActiveTool] = useState<PaintTool>("pencil");
  const [mouseCanvasPos, setMouseCanvasPos] = useState({ x: 0, y: 0 });
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

  // Paste handler (Cmd+V)
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

  // Copy handler (Cmd+C) — copy selected image to clipboard
  useEffect(() => {
    function handleCopy(e: ClipboardEvent) {
      if (!selectedId) return;
      if ((e.target as HTMLElement).isContentEditable) return;

      const selectedItem = items.find((i) => i.id === selectedId);
      if (!selectedItem || selectedItem.type !== "image" || !selectedItem.content) return;

      e.preventDefault();

      // Fetch the image and write to clipboard as PNG
      fetch(selectedItem.content)
        .then((res) => res.blob())
        .then((blob) => {
          // Clipboard API requires image/png
          const canvas = document.createElement("canvas");
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d")!;
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((pngBlob) => {
              if (pngBlob) {
                navigator.clipboard.write([
                  new ClipboardItem({ "image/png": pngBlob }),
                ]);
              }
            }, "image/png");
          };
          img.src = selectedItem.content!;
        })
        .catch(() => {});
    }

    document.addEventListener("copy", handleCopy);
    return () => document.removeEventListener("copy", handleCopy);
  }, [selectedId, items]);

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

  // Double click or click with text tool → new text item
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (!room?.id) return;
      if (activeTool === "text") {
        const pos = screenToCanvas(
          e.clientX,
          e.clientY,
          canvasState.offsetX,
          canvasState.offsetY,
          canvasState.scale
        );
        addItem("text", pos.x, pos.y, { content: "" });
      }
    },
    [room?.id, activeTool, canvasState, addItem]
  );

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

  const handleNewText = useCallback(() => {
    if (!room?.id) return;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const pos = screenToCanvas(cx, cy, canvasState.offsetX, canvasState.offsetY, canvasState.scale);
    addItem("text", pos.x, pos.y, { content: "" });
  }, [room?.id, canvasState, addItem]);

  const handleUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/r/${slug}`;
    await navigator.clipboard.writeText(url);
  }, [slug]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedId) {
      deleteItem(selectedId);
      setSelectedId(null);
    }
  }, [selectedId, deleteItem]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || !room?.id) return;

      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const pos = screenToCanvas(cx, cy, canvasState.offsetX, canvasState.offsetY, canvasState.scale);

      for (const file of files) {
        processAndUpload(file, pos.x, pos.y);
      }

      e.target.value = "";
    },
    [room?.id, canvasState, processAndUpload]
  );

  // Item drag handler
  const handleItemDragStart = useCallback(
    (e: React.PointerEvent, itemId: string, itemX: number, itemY: number) => {
      setDragItemId(itemId);
      startDrag(itemId, e.pointerId, e.clientX, e.clientY, itemX, itemY);
    },
    [startDrag]
  );

  // Pointer move: pan or drag
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      // Track mouse position for status bar
      const pos = screenToCanvas(
        e.clientX,
        e.clientY,
        canvasState.offsetX,
        canvasState.offsetY,
        canvasState.scale
      );
      setMouseCanvasPos(pos);

      if (dragItemId && canvasState.mode === "dragging") {
        const dragPos = getDragPosition(e.clientX, e.clientY);
        if (dragPos) {
          updateItemLocal(dragItemId, { x: dragPos.x, y: dragPos.y });
        }
      } else {
        canvasPointerMove(e);
      }
    },
    [dragItemId, canvasState, getDragPosition, updateItemLocal, canvasPointerMove]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (dragItemId) {
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

  const handleCanvasPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button === 0) {
        setSelectedId(null);
        startPan(e);
      }
    },
    [activeTool, startPan]
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
    <div className="paint-shell">
      {/* Outer MS Paint window */}
      <div className="window paint-window">
        <div className="title-bar">
          <div className="title-bar-text">voidchan - {slug}</div>
          <div className="title-bar-controls">
            <button aria-label="Minimize" />
            <button aria-label="Maximize" />
            <button aria-label="Close" />
          </div>
        </div>

        {/* Menu bar */}
        <PaintMenuBar
          onNewText={handleNewText}
          onUpload={handleUpload}
          onShare={handleShare}
          onSelectAll={() => {}}
          onDeleteSelected={handleDeleteSelected}
          hasSelection={!!selectedId}
          slug={slug}
        />

        {/* Main area: toolbox + canvas */}
        <div className="paint-body">
          <PaintToolbox activeTool={activeTool} onToolChange={setActiveTool} />

          <div className="paint-canvas-wrap">
            <div
              ref={containerRef}
              className={`canvas-container ${canvasState.mode === "panning" ? "panning" : ""} ${
                activeTool === "text" ? "cursor-text" : ""
              }`}
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
                    onDelete={deleteItem}
                    onUpdate={updateItem}
                    onDragStart={handleItemDragStart}
                    onSelect={setSelectedId}
                    onBringToFront={bringToFront}
                  />
                ))}
              </CanvasViewport>

              {items.length === 0 && (
                <div className="empty-state">
                  Double-click to add text · Ctrl+V to paste · Drag files to upload
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom: color palette + status bar */}
        <PaintColorPalette />
        <PaintStatusBar
          connectedCount={connectedCount}
          canvasX={mouseCanvasPos.x}
          canvasY={mouseCanvasPos.y}
          scale={canvasState.scale}
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,*/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </div>
  );
}
