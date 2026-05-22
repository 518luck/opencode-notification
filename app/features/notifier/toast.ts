import type { PluginInput } from "@opencode-ai/plugin";
import type { NotificationConfig } from "../../shared/types";

type ToastVariant = "info" | "success" | "error";

// 创建 TUI 弹窗通知器函数
export function createToastNotifier(
  client: PluginInput["client"],
  config: NotificationConfig,
) {
  // 发送编辑器内 TUI 界面 Toast 提示消息
  return async function sendToastNotification(message: string) {
    if (!config.toast.enabled) return;
    try {
      await client.tui.showToast({
        body: {
          message,
          variant: (config.toast.variant as ToastVariant) || "info",
        },
      });
    } catch {}
  };
}
