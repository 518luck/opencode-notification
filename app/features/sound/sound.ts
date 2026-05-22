import type { PluginInput } from "@opencode-ai/plugin";
import { existsSync, mkdirSync, readdirSync } from "fs";
import { join } from "path";
import {
  AUDIO_EXTENSIONS,
  SYSTEM_BELL_FILES,
  SYSTEM_SOUND_PATHS,
} from "../../shared/constants";
import type { NotificationConfig } from "../../shared/types";
import { WeightManager } from "./model/weight-manager";

// 查找系统自带的铃声音频文件（支持精准白名单匹配与目录扫描降级）
function findSystemBell(): string | null {
  for (const dir of SYSTEM_SOUND_PATHS) {
    if (!existsSync(dir)) continue;

    for (const name of SYSTEM_BELL_FILES) {
      const fullPath = join(dir, name);
      if (existsSync(fullPath)) return fullPath;
    }

    try {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        if (AUDIO_EXTENSIONS.some((ext) => entry.toLowerCase().endsWith(ext))) {
          return join(dir, entry);
        }
      }
    } catch {
      continue;
    }
  }

  return null;
}

// 创建并初始化声音通知器，准备自定义播放目录及权重管理器
export function createVoiceNotifier(
  $: PluginInput["$"],
  config: NotificationConfig,
  pluginDir: string,
) {
  const musicsDir = join(
    pluginDir,
    config.voice.customVoice.musicsDir || "assets/sound",
  );
  if (!existsSync(musicsDir)) {
    mkdirSync(musicsDir, { recursive: true });
  }

  const weightManager = new WeightManager(
    musicsDir,
    config.voice.decayFactor || 0.7,
  );

  // 播放自定义语音文件（根据权重比率挑选音频进行播放）
  async function playCustomVoice() {
    if (!config.voice.customVoice.enabled) return;
    if (weightManager.getFiles().length === 0) return;

    const picked = weightManager.pick();
    if (!picked) return;

    const filePath = join(musicsDir, picked);
    const player = config.voice.player || "paplay";

    try {
      await $`${player} ${filePath}`.quiet().nothrow();
    } catch {
      // Audio playback is best-effort and should never interrupt opencode.
    }

    weightManager.afterPlayed(picked);
  }

  // 播放系统默认铃声（若启用则查找并播放系统自带的提示音）
  async function playDefaultBell() {
    if (!config.voice.defaultBell.enabled) return;

    const bellFile = findSystemBell();
    if (!bellFile) return;

    const player = config.voice.player || "paplay";
    try {
      await $`${player} ${bellFile}`.quiet().nothrow();
    } catch {
      // Audio playback is best-effort and should never interrupt opencode.
    }
  }

  // 声音通知的执行入口，根据配置的播放模式触发相应的音效播放
  return async function notifyVoice() {
    if (!config.voice.enabled) return;

    if (config.voice.mode === "custom") {
      await playCustomVoice();
    }
    if (config.voice.mode === "default" || config.voice.defaultBell.enabled) {
      await playDefaultBell();
    }
  };
}
