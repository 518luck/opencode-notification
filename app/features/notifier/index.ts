import type { PluginInput } from "@opencode-ai/plugin";
import { createVoiceNotifier } from "../sound/sound";
import { EVENT_MESSAGES } from "../../shared/constants";
import type { NotificationConfig } from "../../shared/types";
import { createDesktopNotifier, isEventEnabled } from "./desktop";
import { createToastNotifier } from "./toast";

export function createNotifier(
  input: Pick<PluginInput, "$" | "client" | "project">,
  config: NotificationConfig,
  pluginDir: string,
) {
  const { $, client, project } = input;
  const projectName =
    (project as any)?.name ||
    (project as any).worktree.split(/[\\/]/).filter(Boolean).pop() ||
    "OpenCode";
  const sendDesktop = createDesktopNotifier(
    $,
    config.events,
    config.desktop.enabled,
    config.desktop.showImage,
    config.desktop.imageDecayFactor,
    config.desktop.appName,
    projectName,
    pluginDir,
  );
  const sendToast = createToastNotifier(client, config);
  const notifyVoice = createVoiceNotifier($, config, pluginDir);

  return {
    async notify(eventType: string) {
      if (!config.enabled) return;
      if (!isEventEnabled(config.events[eventType])) return;

      const message = EVENT_MESSAGES[eventType] || "OpenCode 通知";

      await sendDesktop(message, eventType);
      await sendToast(message);
      await notifyVoice();
    },
  };
}
