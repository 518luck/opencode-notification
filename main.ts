import type { Plugin } from "@opencode-ai/plugin";
import type { NotificationConfig } from "./app/shared/types";
import { createNotifier } from "./app/features/notifier";
import { EVENT_MESSAGES } from "./app/shared/constants";
import { loadNotificationConfig } from "./app/shared/utils";

const pluginDir = import.meta.dir;

const IDLE_NOTIFY_DELAY_MS = 800;

const SESSION_END_SUPPRESS_MS = 1500;

function isAbortSessionError(event: unknown): boolean {
  try {
    const text = JSON.stringify(event).toLowerCase();
    return (
      text.includes("messageabortederror") ||
      text.includes("aborterror") ||
      text.includes("aborted") ||
      text.includes("cancelled") ||
      text.includes("canceled")
    );
  } catch {
    return false;
  }
}

export const NotificationPlugin = (async (input, options) => {
  const config = loadNotificationConfig(options as Partial<NotificationConfig> | undefined);
  const projectDir = input.directory;
  const notifier = createNotifier(input, config, pluginDir, projectDir);
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  let suppressIdleUntil = 0;

  function cancelPendingIdle() {
    if (!idleTimer) return;
    clearTimeout(idleTimer);
    idleTimer = undefined;
  }

  return {
    event: async ({ event }) => {
      const eventType = event.type;
      if (!(eventType in EVENT_MESSAGES)) return;

      if (eventType === "session.idle") {
        if (Date.now() < suppressIdleUntil) return;
        cancelPendingIdle();
        idleTimer = setTimeout(() => {
          idleTimer = undefined;
          if (Date.now() < suppressIdleUntil) return;
          void notifier.notify(eventType);
        }, IDLE_NOTIFY_DELAY_MS);
        return;
      }

      if (eventType === "session.error") {
        cancelPendingIdle();
        suppressIdleUntil = Date.now() + SESSION_END_SUPPRESS_MS;
        if (isAbortSessionError(event)) return;
      }

      await notifier.notify(eventType);
    },
  };
}) satisfies Plugin;

export default NotificationPlugin;
