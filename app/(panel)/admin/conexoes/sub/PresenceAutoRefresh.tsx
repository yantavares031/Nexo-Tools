"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PRESENCE_CHANGED_EVENT } from "@/components/realtime/realtime-listener";

/** Recarrega a lista do servidor quando o canal SSE avisa que alguém entrou ou saiu. */
export function PresenceAutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => router.refresh();
    window.addEventListener(PRESENCE_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(PRESENCE_CHANGED_EVENT, refresh);
  }, [router]);

  return null;
}
