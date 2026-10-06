"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { SESSION_ENDED_LOGIN_PATH } from "@/lib/session-cookie";
import type { RealtimeNotice } from "@/types/globals";

const STREAM_URL = "/api/realtime/stream";
const NOTICE_DURATION_MS = 12_000;
/** O EventSource só reconecta sozinho em queda de rede; resposta de erro (401, 502) fecha de vez. */
const RETRY_AFTER_CLOSE_MS = 15_000;

export const PRESENCE_CHANGED_EVENT = "nexo:presence-changed";

function showNotice(notice: RealtimeNotice) {
  const options = { description: notice.message, duration: NOTICE_DURATION_MS };
  if (notice.variant === "success") toast.success(notice.title, options);
  else if (notice.variant === "warning") toast.warning(notice.title, options);
  else toast.info(notice.title, options);
}

export function RealtimeListener() {
  useEffect(() => {
    let source: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let isStopped = false;

    function connect() {
      source = new EventSource(STREAM_URL);

      source.addEventListener("notice", (event) => {
        try {
          showNotice(JSON.parse((event as MessageEvent<string>).data) as RealtimeNotice);
        } catch {
          // evento malformado: ignora
        }
      });

      source.addEventListener("session.terminated", () => {
        isStopped = true;
        source?.close();
        window.location.replace(SESSION_ENDED_LOGIN_PATH);
      });

      source.addEventListener("presence.changed", () => {
        window.dispatchEvent(new Event(PRESENCE_CHANGED_EVENT));
      });

      source.onerror = () => {
        if (source?.readyState !== EventSource.CLOSED || isStopped) return;
        retryTimer = setTimeout(connect, RETRY_AFTER_CLOSE_MS);
      };
    }

    connect();

    return () => {
      isStopped = true;
      if (retryTimer) clearTimeout(retryTimer);
      source?.close();
    };
  }, []);

  return null;
}
