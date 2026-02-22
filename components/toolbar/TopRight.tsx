"use client";

import { useState, useCallback } from "react";

interface TopRightProps {
  connectedCount: number;
  slug: string;
}

export function TopRight({ connectedCount, slug }: TopRightProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/r/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [slug]);

  return (
    <div className="top-right">
      <div className="online-badge" title={`${connectedCount} user(s) online`}>
        <span className="online-dot" />
        {connectedCount}
      </div>
      <button className="share-btn" onClick={handleShare}>
        {copied ? "Copied!" : "Share"}
      </button>
    </div>
  );
}
