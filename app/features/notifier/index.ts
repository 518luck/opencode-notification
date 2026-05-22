import type { PluginInput } from "@opencode-ai/plugin";
import { createVoiceNotifier } from "../sound/sound";
import { EVENT_MESSAGES } from "../../shared/constants";
import type { NotificationConfig } from "../../shared/types";
import { createDesktopNotifier } from "./desktop";
import { createToastNotifier } from "./toast";

export function createNotifier(
  input: Pick<PluginInput, "$" | "client">,
  config: NotificationConfig,
  pluginDir: string,
) {
  const { $, client } = input;
  const sendDesktop = createDesktopNotifier($, config, pluginDir);
  const sendToast = createToastNotifier(client, config);
  const notifyVoice = createVoiceNotifier($, config, pluginDir);

  return {
    async notify(eventType: string) {
      if (!config.enabled) return;
      if (!config.events[eventType]) return;

      const message = EVENT_MESSAGES[eventType] || "OpenCode 通知";

      await sendDesktop(message, eventType);
      await sendToast(message);
      await notifyVoice();
    },
  };
}
