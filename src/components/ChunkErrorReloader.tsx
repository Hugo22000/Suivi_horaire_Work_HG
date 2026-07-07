"use client";

import { useEffect } from "react";

/**
 * Recovers from stale chunk-load failures.
 *
 * When the dev server (or a new deployment) rebuilds, previously loaded
 * chunk URLs can become invalid. The browser then emits a generic error
 * event (often surfaced as `{ "isTrusted": true }`) originating from the
 * chunk loader. We detect that case and reload the page a single time to
 * fetch the fresh chunk manifest, guarding against reload loops.
 */
export default function ChunkErrorReloader() {
  useEffect(() => {
    const RELOAD_FLAG = "__chunk_reload_attempted__";

    const isChunkLoadError = (message: string) =>
      /Loading chunk [\d]+ failed/i.test(message) ||
      /ChunkLoadError/i.test(message) ||
      /loadChunk/i.test(message) ||
      /Failed to fetch dynamically imported module/i.test(message);

    const recover = () => {
      if (sessionStorage.getItem(RELOAD_FLAG)) return;
      sessionStorage.setItem(RELOAD_FLAG, "1");
      window.location.reload();
    };

    // Clear the guard once the page has loaded successfully.
    const clearFlag = () => sessionStorage.removeItem(RELOAD_FLAG);

    const onError = (event: ErrorEvent) => {
      const target = event.target as HTMLElement | null;
      // Failed <script>/<link> chunk resource loads bubble up as error events
      // on the element with an empty message.
      if (
        target &&
        (target.tagName === "SCRIPT" || target.tagName === "LINK")
      ) {
        recover();
        return;
      }
      if (event.message && isChunkLoadError(event.message)) {
        recover();
      }
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        typeof reason === "string" ? reason : reason?.message ?? "";
      if (message && isChunkLoadError(message)) {
        recover();
      }
    };

    window.addEventListener("load", clearFlag);
    window.addEventListener("error", onError, true);
    window.addEventListener("unhandledrejection", onRejection);

    return () => {
      window.removeEventListener("load", clearFlag);
      window.removeEventListener("error", onError, true);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
