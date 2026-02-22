"use client";

const COLORS = [
  "#000000", "#808080", "#800000", "#808000", "#008000", "#008080",
  "#000080", "#800080", "#808040", "#004040", "#0080ff", "#004080",
  "#4000ff", "#804000",
  "#ffffff", "#c0c0c0", "#ff0000", "#ffff00", "#00ff00", "#00ffff",
  "#0000ff", "#ff00ff", "#ffff80", "#00ff80", "#80ffff", "#8080ff",
  "#ff0080", "#ff8040",
];

export function PaintColorPalette() {
  return (
    <div className="paint-palette">
      <div className="paint-color-preview">
        <div className="paint-color-fg" style={{ background: "#000000" }} />
        <div className="paint-color-bg" style={{ background: "#ffffff" }} />
      </div>
      <div className="paint-color-grid">
        {COLORS.map((color) => (
          <button
            key={color}
            className="paint-color-swatch"
            style={{ background: color }}
            title={color}
          />
        ))}
      </div>
    </div>
  );
}
