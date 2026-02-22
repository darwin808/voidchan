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
    <div className="landing-window">
      <div className="landing-title">voidchan</div>
      <div className="landing-subtitle">
        Drop anything. Share with anyone.
        <br />
        Anonymous. Ephemeral.
      </div>
      <button className="landing-btn" onClick={handleCreate}>
        Create New Board
      </button>
    </div>
  );
}
