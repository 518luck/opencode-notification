import type { PluginInput } from "@opencode-ai/plugin";
import { EVENT_MESSAGES } from "./constants";
import { createVoiceNotifier } from "./sound";
import type { NotificationConfig } from "./types";

type ToastVariant = "info" | "success" | "error";

// 创建并初始化通知器实例，整合桌面、TUI 弹窗及声音通知通道
export function createNotifier(
  input: Pick<PluginInput, "$" | "client">,
  config: NotificationConfig,
  pluginDir: string,
) {
  const { $, client } = input;
  const notifyVoice = createVoiceNotifier($, config, pluginDir);

  // 发送系统级桌面通知（通过 notify-send）
  async function sendDesktopNotification(message: string) {
    if (!config.desktop.enabled) return;
    try {
      await $`notify-send "OpenCode" ${message}`.quiet();
    } catch {
      // Desktop notifications are best-effort.
    }
  }

  // 发送编辑器内 TUI 界面 Toast 提示消息
  async function sendToastNotification(message: string) {
    if (!config.toast.enabled) return;
    try {
      await client.tui.showToast({
        body: {
          message,
          variant: (config.toast.variant as ToastVariant) || "info",
        },
      });
    } catch {
      // TUI may be unavailable depending on how opencode is running.
    }
  }

  return {
    // 触发指定事件类型的通知，自动分发到所有已启用的通知通道
    async notify(eventType: string) {
      if (!config.enabled) return;
      if (!config.events[eventType]) return;

      const message = EVENT_MESSAGES[eventType] || "OpenCode 通知";

      await sendDesktopNotification(message);
      await sendToastNotification(message);
      await notifyVoice();
    },
  };
}
