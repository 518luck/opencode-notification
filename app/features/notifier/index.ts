import type { PluginInput } from "@opencode-ai/plugin";
import { createVoiceNotifier } from "../sound/sound";
import { EVENT_MESSAGES } from "../../shared/constants";
import type { NotificationConfig } from "../../shared/types";
import { createDesktopNotifier } from "./desktop";
import { createToastNotifier } from "./toast";

// 创建并初始化通知器实例，整合桌面、TUI 弹窗及声音通知通道
export function createNotifier(
  input: Pick<PluginInput, "$" | "client">,
  config: NotificationConfig,
  pluginDir: string,
) {
  const { $, client } = input;
  const sendDesktop = createDesktopNotifier($, config);
  const sendToast = createToastNotifier(client, config);
  const notifyVoice = createVoiceNotifier($, config, pluginDir);

  return {
    // 触发指定事件类型的通知，自动分发到所有已启用的通知通道
    async notify(eventType: string) {
      if (!config.enabled) return;
      if (!config.events[eventType]) return;

      const message = EVENT_MESSAGES[eventType] || "OpenCode 通知";

      await sendDesktop(message);
      await sendToast(message);
      await notifyVoice();
    },
  };
}
