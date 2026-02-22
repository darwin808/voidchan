"use client";

export type PaintTool = "select" | "text" | "pan";

interface PaintToolboxProps {
  activeTool: PaintTool;
  onToolChange: (tool: PaintTool) => void;
}

const tools: { id: PaintTool; icon: string; title: string }[] = [
  { id: "select", icon: "⬚", title: "Select" },
  { id: "text", icon: "A", title: "Text" },
  { id: "pan", icon: "✋", title: "Pan" },
];

export function PaintToolbox({ activeTool, onToolChange }: PaintToolboxProps) {
  return (
    <div className="paint-toolbox">
      <div className="paint-toolbox-grid">
        {tools.map((tool) => (
          <button
            key={tool.id}
            className={`paint-tool-btn ${activeTool === tool.id ? "active" : ""}`}
            onClick={() => onToolChange(tool.id)}
            title={tool.title}
          >
            {tool.icon}
          </button>
        ))}
      </div>
    </div>
  );
}
