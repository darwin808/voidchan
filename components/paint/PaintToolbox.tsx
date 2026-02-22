"use client";

export type PaintTool = "select" | "freeselect" | "eraser" | "fill" | "picker" | "magnifier" | "pencil" | "brush" | "airbrush" | "text" | "line" | "curve" | "rect" | "polygon" | "ellipse" | "roundrect";

interface PaintToolboxProps {
  activeTool: PaintTool;
  onToolChange: (tool: PaintTool) => void;
}

// MS Paint Win95 toolbox: 2 columns × 8 rows = 16 tools
// Using Unicode/ASCII approximations of the original icons
const tools: { id: PaintTool; icon: string; title: string }[] = [
  { id: "freeselect", icon: "⬡", title: "Free-Form Select" },
  { id: "select", icon: "⬚", title: "Select" },
  { id: "eraser", icon: "▦", title: "Eraser/Color Eraser" },
  { id: "fill", icon: "🪣", title: "Fill With Color" },
  { id: "picker", icon: "💧", title: "Pick Color" },
  { id: "magnifier", icon: "🔍", title: "Magnifier" },
  { id: "pencil", icon: "✏", title: "Pencil" },
  { id: "brush", icon: "🖌", title: "Brush" },
  { id: "airbrush", icon: "💨", title: "Airbrush" },
  { id: "text", icon: "A", title: "Text" },
  { id: "line", icon: "╲", title: "Line" },
  { id: "curve", icon: "〜", title: "Curve" },
  { id: "rect", icon: "▭", title: "Rectangle" },
  { id: "polygon", icon: "⬠", title: "Polygon" },
  { id: "ellipse", icon: "◯", title: "Ellipse" },
  { id: "roundrect", icon: "▢", title: "Rounded Rectangle" },
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
            <span className="paint-tool-icon">{tool.icon}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
