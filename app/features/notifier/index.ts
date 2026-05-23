import type { PluginInput } from "@opencode-ai/plugin";
import { createVoiceNotifier } from "../sound/sound";
import { EVENT_MESSAGES } from "../../shared/constants";
import type { NotificationConfig } from "../../shared/types";
import { isEventEnabled } from "../../shared/utils";
import { createDesktopNotifier } from "./desktop";
import { createToastNotifier } from "./toast";

// 创建并初始化通知器实例，配置桌面、Toast 以及语音等通知通道
export function createNotifier(
  input: Pick<PluginInput, "$" | "client" | "project">,
  config: NotificationConfig,
  pluginDir: string,
) {
  const { $, client, project } = input;
  const projectName =
    (project as any)?.name ||
    project?.worktree?.split(/[\\/]/).filter(Boolean).pop() ||
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
    // 触发并发送指定事件类型的各类通知（桌面、Toast、语音）
    async notify(eventType: string) {
      if (!config.enabled) return;
      if (!isEventEnabled(config.events[eventType])) return;

      const message = EVENT_MESSAGES[eventType] || "OpenCode 通知";

      await sendDesktop(message, eventType);
      await sendToast(message);
      await notifyVoice(eventType);
    },
  };
}
