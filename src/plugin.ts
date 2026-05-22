import type { Plugin } from "@opencode-ai/plugin";
import { EVENT_MESSAGES } from "./constants";
import { loadNotificationConfig } from "./load-config";
import { createNotifier } from "./notifier";

// 创建并初始化通知插件的工厂函数
export function createNotificationPlugin(pluginDir: string): Plugin {
  return async (input) => {
    const config = loadNotificationConfig(pluginDir);
    const notifier = createNotifier(input, config, pluginDir);

    return {
      // 监听系统事件，若匹配到预设的通知事件则触发相应的通知分发
      event: async ({ event }) => {
        const eventType = event.type;
        if (eventType in EVENT_MESSAGES) {
          await notifier.notify(eventType);
        }
      },
    };
  };
}
