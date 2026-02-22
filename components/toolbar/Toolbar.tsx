"use client";

import { useCallback, useState } from "react";

export type Tool = "select" | "hand" | "text";

interface ToolbarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  onUpload: () => void;
}

const tools: { id: Tool; icon: string; label: string; shortcut: string }[] = [
  { id: "select", icon: "↖", label: "Select", shortcut: "V" },
  { id: "hand", icon: "✋", label: "Hand (pan)", shortcut: "H" },
  { id: "text", icon: "T", label: "Text", shortcut: "T" },
];

export function Toolbar({ activeTool, onToolChange, onUpload }: ToolbarProps) {
  return (
    <div className="toolbar">
      {tools.map((tool) => (
        <button
          key={tool.id}
          className={`toolbar-btn ${activeTool === tool.id ? "active" : ""}`}
          onClick={() => onToolChange(tool.id)}
          title={`${tool.label} — ${tool.shortcut}`}
        >
          {tool.icon}
        </button>
      ))}
      <div className="toolbar-sep" />
      <button className="toolbar-btn" onClick={onUpload} title="Upload image">
        🖼
      </button>
    </div>
  );
}
