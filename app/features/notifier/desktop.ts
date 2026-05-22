import type { PluginInput } from "@opencode-ai/plugin";
import type { NotificationConfig } from "../../shared/types";

// 创建桌面通知器函数
export function createDesktopNotifier(
  $: PluginInput["$"],
  config: NotificationConfig,
) {
  // 发送系统级桌面通知（调用 notify-send 命令）
  return async function sendDesktopNotification(message: string) {
    if (!config.desktop.enabled) return;
    try {
      await $`notify-send "OpenCode" ${message}`.quiet();
    } catch {}
  };
}
