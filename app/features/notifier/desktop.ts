import type { PluginInput } from "@opencode-ai/plugin";
import { existsSync, statSync } from "fs";
import { join } from "path";
import { EVENT_ICONS, IMAGE_EXTENSIONS } from "../../shared/constants";
import {
  getEventConfig,
  isEventEnabled,
  resolveAssetPath,
  WeightedPicker,
} from "../../shared/utils";
import type { EventConfig } from "../../shared/types";

function isDir(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

export function createDesktopNotifier(
  $: PluginInput["$"],
  events: Record<string, EventConfig>,
  desktopEnabled: boolean,
  showImage: boolean,
  imageDecayFactor: number,
  appName: string,
  projectName: string,
  pluginDir: string,
  projectDir: string,
) {
  const imagePickers = new Map<string, WeightedPicker>();

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
    const resolved = resolveAssetPath(raw, pluginDir, projectDir);
    if (isDir(resolved)) return undefined;
    return existsSync(resolved) ? resolved : undefined;
  }

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

    const resolved = resolveAssetPath(raw, pluginDir, projectDir);

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

    args.push("-a", appName, projectName, message);

    try {
      await $`${args}`.quiet();
    } catch {}
  };
}
