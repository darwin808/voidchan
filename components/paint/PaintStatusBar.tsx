"use client";

import { useState, useEffect } from "react";

interface PaintStatusBarProps {
  connectedCount: number;
  canvasX: number;
  canvasY: number;
  scale: number;
}

export function PaintStatusBar({
  connectedCount,
  canvasX,
  canvasY,
  scale,
}: PaintStatusBarProps) {
  const [time, setTime] = useState("");

  useEffect(() => {
    function updateClock() {
      setTime(
        new Date().toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        })
      );
    }
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="paint-statusbar">
      <div className="paint-status-cell">
        {Math.round(canvasX)}, {Math.round(canvasY)}
      </div>
      <div className="paint-status-cell">{Math.round(scale * 100)}%</div>
      <div className="paint-status-cell">{connectedCount} online</div>
      <div className="paint-status-cell paint-status-clock">{time}</div>
    </div>
  );
}
