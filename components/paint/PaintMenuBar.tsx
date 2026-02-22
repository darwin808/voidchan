"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface PaintMenuBarProps {
  onNewText: () => void;
  onUpload: () => void;
  onShare: () => void;
  onSelectAll: () => void;
  onDeleteSelected: () => void;
  hasSelection: boolean;
  slug: string;
}

type OpenMenu = "file" | "edit" | "view" | "image" | "colors" | "help" | null;

export function PaintMenuBar({
  onNewText,
  onUpload,
  onShare,
  onSelectAll,
  onDeleteSelected,
  hasSelection,
  slug,
}: PaintMenuBarProps) {
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleMenuClick = useCallback(
    (menu: OpenMenu) => {
      setOpenMenu(openMenu === menu ? null : menu);
    },
    [openMenu]
  );

  const closeAndRun = useCallback((fn: () => void) => {
    setOpenMenu(null);
    fn();
  }, []);

  return (
    <div className="paint-menubar" ref={menuRef}>
      {/* File */}
      <div className="paint-menu-item">
        <button
          className={`paint-menu-btn ${openMenu === "file" ? "active" : ""}`}
          onClick={() => handleMenuClick("file")}
          onMouseEnter={() => openMenu && setOpenMenu("file")}
        >
          <u>F</u>ile
        </button>
        {openMenu === "file" && (
          <div className="paint-dropdown">
            <button onClick={() => closeAndRun(() => window.open("/", "_self"))}>
              <u>N</u>ew
            </button>
            <button onClick={() => closeAndRun(onUpload)}>
              <u>O</u>pen...
            </button>
            <div className="paint-dropdown-sep" />
            <button onClick={() => closeAndRun(onShare)}>
              Share <u>L</u>ink
            </button>
            <div className="paint-dropdown-sep" />
            <button onClick={() => closeAndRun(() => window.open("/", "_blank"))}>
              New <u>B</u>oard
            </button>
          </div>
        )}
      </div>

      {/* Edit */}
      <div className="paint-menu-item">
        <button
          className={`paint-menu-btn ${openMenu === "edit" ? "active" : ""}`}
          onClick={() => handleMenuClick("edit")}
          onMouseEnter={() => openMenu && setOpenMenu("edit")}
        >
          <u>E</u>dit
        </button>
        {openMenu === "edit" && (
          <div className="paint-dropdown">
            <button onClick={() => closeAndRun(onNewText)}>
              Paste <u>T</u>ext
              <span className="paint-shortcut">Dbl-Click</span>
            </button>
            <button onClick={() => closeAndRun(onUpload)}>
              Paste <u>I</u>mage
              <span className="paint-shortcut">Ctrl+V</span>
            </button>
            <div className="paint-dropdown-sep" />
            <button
              onClick={() => closeAndRun(onDeleteSelected)}
              disabled={!hasSelection}
            >
              <u>D</u>elete
              <span className="paint-shortcut">Del</span>
            </button>
            <button onClick={() => closeAndRun(onSelectAll)}>
              Select <u>A</u>ll
              <span className="paint-shortcut">Ctrl+A</span>
            </button>
          </div>
        )}
      </div>

      {/* View */}
      <div className="paint-menu-item">
        <button
          className={`paint-menu-btn ${openMenu === "view" ? "active" : ""}`}
          onClick={() => handleMenuClick("view")}
          onMouseEnter={() => openMenu && setOpenMenu("view")}
        >
          <u>V</u>iew
        </button>
        {openMenu === "view" && (
          <div className="paint-dropdown">
            <button disabled>
              <u>T</u>ool Box
            </button>
            <button disabled>
              <u>C</u>olor Box
            </button>
            <button disabled>
              <u>S</u>tatus Bar
            </button>
          </div>
        )}
      </div>

      {/* Image */}
      <div className="paint-menu-item">
        <button
          className={`paint-menu-btn ${openMenu === "image" ? "active" : ""}`}
          onClick={() => handleMenuClick("image")}
          onMouseEnter={() => openMenu && setOpenMenu("image")}
        >
          <u>I</u>mage
        </button>
        {openMenu === "image" && (
          <div className="paint-dropdown">
            <button disabled>
              <u>F</u>lip/Rotate...
            </button>
            <button disabled>
              <u>S</u>tretch/Skew...
            </button>
            <button disabled>
              <u>I</u>nvert Colors
            </button>
            <button disabled>
              <u>A</u>ttributes...
            </button>
          </div>
        )}
      </div>

      {/* Colors */}
      <div className="paint-menu-item">
        <button
          className={`paint-menu-btn ${openMenu === "colors" ? "active" : ""}`}
          onClick={() => handleMenuClick("colors")}
          onMouseEnter={() => openMenu && setOpenMenu("colors")}
        >
          <u>C</u>olors
        </button>
        {openMenu === "colors" && (
          <div className="paint-dropdown">
            <button disabled>
              <u>E</u>dit Colors...
            </button>
          </div>
        )}
      </div>

      {/* Help */}
      <div className="paint-menu-item">
        <button
          className={`paint-menu-btn ${openMenu === "help" ? "active" : ""}`}
          onClick={() => handleMenuClick("help")}
          onMouseEnter={() => openMenu && setOpenMenu("help")}
        >
          <u>H</u>elp
        </button>
        {openMenu === "help" && (
          <div className="paint-dropdown">
            <button
              onClick={() =>
                closeAndRun(() =>
                  alert(
                    "voidchan\n\nAnonymous ephemeral shared canvas.\n\nDouble-click: New text\nCtrl+V: Paste image\nCtrl+C: Copy image\nDrag title bar: Move\nScroll: Zoom\nClick+drag: Pan"
                  )
                )
              }
            >
              <u>A</u>bout voidchan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
