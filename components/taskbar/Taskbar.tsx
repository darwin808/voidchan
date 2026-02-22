"use client";

import { useState, useEffect, useCallback } from "react";

interface TaskbarProps {
  onNewText: () => void;
  onUpload: () => void;
  connectedCount: number;
  slug: string;
}

export function Taskbar({
  onNewText,
  onUpload,
  connectedCount,
  slug,
}: TaskbarProps) {
  const [time, setTime] = useState("");
  const [copied, setCopied] = useState(false);

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

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/r/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [slug]);

  return (
    <div className="taskbar">
      <button disabled style={{ fontWeight: "bold", minWidth: 60 }}>
        Start
      </button>
      <div className="taskbar-divider" />
      <button onClick={onNewText}>New Text</button>
      <button onClick={onUpload}>Upload</button>
      <div className="taskbar-divider" />
      <span className="taskbar-status">
        {connectedCount} connected
      </span>
      <div className="taskbar-divider" />
      <button onClick={handleShare}>
        {copied ? "Copied!" : "Share"}
      </button>
      <div className="taskbar-clock">{time}</div>
    </div>
  );
}
