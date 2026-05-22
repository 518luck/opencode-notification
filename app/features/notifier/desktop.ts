import type { PluginInput } from "@opencode-ai/plugin";
import { existsSync } from "fs";
import { join } from "path";
import { EVENT_ICONS } from "../../shared/constants";
import type { EventConfig } from "../../shared/types";

type EventValue = boolean | EventConfig;

function isEventEnabled(v: EventValue | undefined): boolean {
  if (!v) return false;
  if (typeof v === "boolean") return v;
  return v.enabled;
}

function getEventConfig(v: EventValue | undefined): EventConfig | null {
  if (!v || typeof v === "boolean") return null;
  return v;
}

export function createDesktopNotifier(
  $: PluginInput["$"],
  events: Record<string, EventValue>,
  desktopEnabled: boolean,
  showImage: boolean,
  pluginDir: string,
) {
  return async function sendDesktopNotification(
    message: string,
    eventType: string,
  ) {
    if (!desktopEnabled) return;

    const eventCfg = getEventConfig(events[eventType]);

    // 优先用事件自定义图标，否则用 EVENT_ICONS 默认映射
    const defaultIconName = EVENT_ICONS[eventType];
    const iconPath =
      eventCfg?.icon || (defaultIconName ? join(pluginDir, "assets", "icons", `${defaultIconName}.svg`) : undefined);

    const imagePath =
      eventCfg?.image || (showImage && iconPath ? iconPath : undefined);

    const args: string[] = ["notify-send"];

    if (iconPath && existsSync(iconPath)) {
      args.push("-i", iconPath);
    }
    if (imagePath && existsSync(imagePath)) {
      args.push("-h", `string:image-path:${imagePath}`);
    }

    args.push("OpenCode", message);

    try {
      await $`${args}`.quiet();
    } catch {}
  };
}

export { isEventEnabled, getEventConfig };
