import type { Plugin } from "@opencode-ai/plugin";
import { createNotifier } from "./app/features/notifier";
import { EVENT_MESSAGES } from "./app/shared/constants";
import { loadNotificationConfig } from "./app/shared/utils";

const pluginDir = import.meta.dir;

// session.idle 延迟通知，给紧随其后的 session.error 留出合并判断窗口
const IDLE_NOTIFY_DELAY_MS = 800;

// 暂停或错误发生后，短时间内压制 session.idle，避免同时播“完成”和“错误”
const SESSION_END_SUPPRESS_MS = 1500;

// 判断 session.error 是否来自用户暂停/中断；这类错误默认静默处理
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
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  let suppressIdleUntil = 0;

  // 取消尚未触发的完成通知，通常用于 error 抢先到达时压掉 idle
  function cancelPendingIdle() {
    if (!idleTimer) return;
    clearTimeout(idleTimer);
    idleTimer = undefined;
  }

  return {
    // 监听系统事件，当匹配到预设的通知事件时触发相应的通知
    event: async ({ event }) => {
      const eventType = event.type;
      if (!(eventType in EVENT_MESSAGES)) return;

      // idle 延迟发送，避免暂停/错误后紧接着回到 idle 时重复通知
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

      // 暂停类 error 静默；真正 error 立即通知，并压掉附近的 idle
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
