"use client";

import { useState, useEffect } from "react";
import { nanoid } from "nanoid";

const SESSION_KEY = "voidchan_session_id";

export function useSessionId(): string {
  const [sessionId] = useState(() => {
    if (typeof window === "undefined") return "";
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = nanoid(12);
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  });

  return sessionId;
}
