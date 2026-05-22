import type { PluginInput } from "@opencode-ai/plugin";
import { existsSync } from "fs";
import { join } from "path";
import { EVENT_ICONS } from "../../shared/constants";
import type { NotificationConfig } from "../../shared/types";

export function createDesktopNotifier(
  $: PluginInput["$"],
  config: NotificationConfig,
  pluginDir: string,
) {
  return async function sendDesktopNotification(
    message: string,
    eventType: string,
  ) {
    if (!config.desktop.enabled) return;

    const iconName = EVENT_ICONS[eventType];
    const iconPath = iconName
      ? join(pluginDir, "assets", "icons", `${iconName}.svg`)
      : undefined;

    const args: string[] = ["notify-send"];

    if (iconPath && existsSync(iconPath)) {
      args.push("-i", iconPath);
      if (config.desktop.showImage) {
        args.push("-h", `string:image-path:${iconPath}`);
      }
    }

    args.push("OpenCode", message);

    try {
      await $`${args}`.quiet();
    } catch {}
  };
}
