import type { PluginInput } from "@opencode-ai/plugin";
import { existsSync, statSync } from "fs";
import { join } from "path";
import { EVENT_ICONS, IMAGE_EXTENSIONS } from "../../shared/constants";
import { WeightedPicker } from "../../shared/utils";
import type { EventConfig } from "../../shared/types";

type EventValue = boolean | EventConfig;

// 判断该事件类型是否已启用通知
function isEventEnabled(v: EventValue | undefined): boolean {
  if (!v) return false;
  if (typeof v === "boolean") return v;
  return v.enabled;
}

// 获取事件的详细配置对象，若为布尔值或为空则返回 null
function getEventConfig(v: EventValue | undefined): EventConfig | null {
  if (!v || typeof v === "boolean") return null;
  return v;
}

// 安全地判断给定的文件路径是否为一个目录
function isDir(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

// 创建桌面通知器函数，初始化图片随机权重管理器
export function createDesktopNotifier(
  $: PluginInput["$"],
  events: Record<string, EventValue>,
  desktopEnabled: boolean,
  showImage: boolean,
  imageDecayFactor: number,
  appName: string,
  projectName: string,
  pluginDir: string,
) {
  const imagePickers = new Map<string, WeightedPicker>();

  // 解析并获取事件对应的图标绝对路径
  function resolveIcon(
    eventCfg: EventConfig | null,
    eventType: string,
  ): string | undefined {
    const raw = eventCfg?.icon;
    if (!raw) {
      const defaultName = EVENT_ICONS[eventType];
      return defaultName
        ? join(pluginDir, "assets", "icons", `${defaultName}.svg`)
        : undefined;
    }
    const resolved = raw.startsWith("/") ? raw : join(pluginDir, raw);
    if (isDir(resolved)) return undefined;
    return existsSync(resolved) ? resolved : undefined;
  }

  // 解析并获取事件对应的通知背景图片绝对路径（支持从目录中随机选择）
  function resolveImage(
    eventCfg: EventConfig | null,
    eventType: string,
  ): string | undefined {
    if (!showImage) return undefined;

    const raw = eventCfg?.image;
    if (!raw) {
      const iconPath = resolveIcon(eventCfg, eventType);
      return iconPath && existsSync(iconPath) ? iconPath : undefined;
    }

    const resolved = raw.startsWith("/") ? raw : join(pluginDir, raw);

    if (isDir(resolved)) {
      let picker = imagePickers.get(resolved);
      if (!picker) {
        picker = new WeightedPicker(
          resolved,
          IMAGE_EXTENSIONS,
          imageDecayFactor,
        );
        imagePickers.set(resolved, picker);
      }
      const picked = picker.pick();
      if (!picked) return undefined;
      picker.afterPlayed(picked);
      return join(resolved, picked);
    }

    return existsSync(resolved) ? resolved : undefined;
  }

  // 组装参数并调用 notify-send 发送包含图标和图片的系统级桌面通知
  return async function sendDesktopNotification(
    message: string,
    eventType: string,
  ) {
    if (!desktopEnabled) return;

    const eventCfg = getEventConfig(events[eventType]);
    const iconPath = resolveIcon(eventCfg, eventType);
    const imagePath = resolveImage(eventCfg, eventType);

    const args: string[] = ["notify-send"];

    if (iconPath && existsSync(iconPath)) {
      args.push("-i", iconPath);
    }
    if (imagePath && existsSync(imagePath)) {
      args.push("-h", `string:image-path:${imagePath}`);
    }

    args.push("-a", appName, "OpenCode", message);

    try {
      await $`${args}`.quiet();
    } catch {}
  };
}

export { isEventEnabled, getEventConfig };
