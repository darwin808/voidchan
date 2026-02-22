"use client";

import { useRouter } from "next/navigation";
import { generateSlug } from "@/lib/utils";

export function LandingWindow() {
  const router = useRouter();

  function handleCreate() {
    const slug = generateSlug();
    router.push(`/r/${slug}`);
  }

  return (
    <div className="window landing-window">
      <div className="title-bar">
        <div className="title-bar-text">voidchan</div>
        <div className="title-bar-controls">
          <button aria-label="Close" />
        </div>
      </div>
      <div className="window-body">
        <div className="landing-title">V O I D C H A N</div>
        <div className="landing-subtitle">
          drop anything. share with anyone.
          <br />
          anonymous. ephemeral.
        </div>
        <button onClick={handleCreate}>Create New Board</button>
      </div>
    </div>
  );
}
