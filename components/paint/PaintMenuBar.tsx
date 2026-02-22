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

type OpenMenu = "file" | "edit" | "view" | "help" | null;

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
          File
        </button>
        {openMenu === "file" && (
          <div className="paint-dropdown">
            <button onClick={() => closeAndRun(() => window.open(`/`, "_blank"))}>
              New Board
            </button>
            <button onClick={() => closeAndRun(onUpload)}>Open...</button>
            <div className="paint-dropdown-sep" />
            <button onClick={() => closeAndRun(onShare)}>Share Link</button>
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
          Edit
        </button>
        {openMenu === "edit" && (
          <div className="paint-dropdown">
            <button onClick={() => closeAndRun(onNewText)}>
              Paste Text <span className="paint-shortcut">Dbl-Click</span>
            </button>
            <button onClick={() => closeAndRun(onUpload)}>
              Paste Image <span className="paint-shortcut">Ctrl+V</span>
            </button>
            <div className="paint-dropdown-sep" />
            <button onClick={() => closeAndRun(onSelectAll)}>
              Select All <span className="paint-shortcut">Ctrl+A</span>
            </button>
            <button
              onClick={() => closeAndRun(onDeleteSelected)}
              disabled={!hasSelection}
            >
              Delete <span className="paint-shortcut">Del</span>
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
          View
        </button>
        {openMenu === "view" && (
          <div className="paint-dropdown">
            <button disabled>Zoom In</button>
            <button disabled>Zoom Out</button>
            <div className="paint-dropdown-sep" />
            <button disabled>Reset View</button>
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
          Help
        </button>
        {openMenu === "help" && (
          <div className="paint-dropdown">
            <button
              onClick={() =>
                closeAndRun(() =>
                  alert(
                    "voidchan - anonymous ephemeral canvas\n\nDouble-click: New text\nCtrl+V: Paste image\nDrag title bar: Move\nScroll: Zoom\nClick+drag canvas: Pan"
                  )
                )
              }
            >
              About voidchan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
