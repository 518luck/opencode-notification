import type { Plugin } from "@opencode-ai/plugin";
import { EVENT_MESSAGES } from "./src/constants";
import { loadNotificationConfig } from "./src/load-config";
import { createNotifier } from "./src/notifier";

const pluginDir = import.meta.dir;

// input 的类型
// export type PluginInput = {
//   client: ReturnType<typeof createOpencodeClient>; // opencode SDK client，可以调用 opencode 内部 API，比如 client.tui.showToast()、client.app.log()、client.session.*()、client.file.*()
//   project: Project;            // 当前项目的信息
//   directory: string;           // 当前 opencode 工作目录
//   worktree: string;            // 当前 git worktree 根目录
//   experimental_workspace: {    // 实验性 workspace 扩展接口，一般插件用不到
//     register(type: string, adapter: WorkspaceAdapter): void;
//   };
//   serverUrl: URL;              // 当前 opencode server 的 URL
//   $: BunShell;                 // Bun Shell API，用来执行 shell 命令，比如 $\\notify-send ...\``
// };
// 插件的初始化回调函数，加载配置并创建通知器实例
export const NotificationPlugin = (async (input) => {
  const config = loadNotificationConfig(pluginDir);
  const notifier = createNotifier(input, config, pluginDir);

  return {
    // 监听系统事件，当匹配到预设的通知事件时触发相应的通知
    event: async ({ event }) => {
      const eventType = event.type;
      if (eventType in EVENT_MESSAGES) {
        await notifier.notify(eventType);
      }
    },
  };
}) satisfies Plugin;

export default NotificationPlugin;
