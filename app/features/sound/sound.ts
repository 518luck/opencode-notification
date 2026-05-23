import type { PluginInput } from "@opencode-ai/plugin";
import {
  accessSync,
  constants as fsConstants,
  existsSync,
  readdirSync,
  statSync,
} from "fs";
import { delimiter, join } from "path";
import {
  AUDIO_EXTENSIONS,
  AUDIO_PLAYER_CANDIDATES,
  SYSTEM_BELL_FILES,
  SYSTEM_SOUND_PATHS,
} from "../../shared/constants";
import type { EventConfig, NotificationConfig } from "../../shared/types";
import { getEventConfig, WeightedPicker } from "../../shared/utils";

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

// 检查系统环境路径中是否存在并可执行指定的播放器命令
function canRunCommand(command: string): boolean {
  const paths = command.includes("/")
    ? [command]
    : (process.env.PATH || "")
        .split(delimiter)
        .map((dir) => join(dir, command));

  for (const path of paths) {
    try {
      accessSync(path, fsConstants.X_OK);
      return true;
    } catch {
      continue;
    }
  }

  return false;
}

// 判断给定的文件路径是否为一个目录
function isDir(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

// 解析音频文件路径，若为相对路径则补全为绝对路径
function resolvePath(pluginDir: string, raw: string): string {
  return raw.startsWith("/") ? raw : join(pluginDir, raw);
}

// 创建并初始化语音通知器实例
export function createVoiceNotifier(
  $: PluginInput["$"],
  config: NotificationConfig,
  pluginDir: string,
) {
  const voicePickers = new Map<string, WeightedPicker>();
  let rememberedPlayer: string | null = null;

  // 获取已配置的播放器及系统预设的候选播放器列表
  function getPlayerCandidates(): string[] {
    const configured = config.voice.player?.trim();
    const candidates = configured
      ? [configured, ...AUDIO_PLAYER_CANDIDATES]
      : AUDIO_PLAYER_CANDIDATES;
    return Array.from(new Set(candidates.filter(Boolean)));
  }

  // 调用指定的命令行播放器执行音频播放
  async function runPlayer(player: string, filePath: string) {
    if (player === "ffplay") {
      return await $`ffplay -nodisp -autoexit -loglevel quiet ${filePath}`
        .quiet()
        .nothrow();
    }

    return await $`${player} ${filePath}`.quiet().nothrow();
  }

  // 先用已记住的播放器；若不可用或播放失败，再按候选列表回退并重新记忆成功项
  async function playAudioFile(filePath: string): Promise<boolean> {
    const candidates = getPlayerCandidates();
    const players = rememberedPlayer
      ? [
          rememberedPlayer,
          ...candidates.filter((item) => item !== rememberedPlayer),
        ]
      : candidates;

    for (const player of players) {
      if (!canRunCommand(player)) continue;

      const result = await runPlayer(player, filePath);
      if (result.exitCode === 0) {
        rememberedPlayer = player;
        return true;
      }
    }

    return false;
  }

  // 解析事件对应的声音文件，若是目录则随机选择一个音频
  function resolveVoiceFile(eventCfg: EventConfig | null): {
    filePath: string | null;
    picked?: string;
    picker?: WeightedPicker;
  } {
    if (!eventCfg?.voice) return { filePath: null };

    const resolved = resolvePath(pluginDir, eventCfg.voice);
    if (!existsSync(resolved)) return { filePath: null };

    if (!isDir(resolved)) return { filePath: resolved };

    let picker = voicePickers.get(resolved);
    if (!picker) {
      picker = new WeightedPicker(
        resolved,
        AUDIO_EXTENSIONS,
        config.voice.decayFactor ?? 0.7,
      );
      voicePickers.set(resolved, picker);
    }

    const picked = picker.pick();
    if (!picked) return { filePath: null };

    return { filePath: join(resolved, picked), picked, picker };
  }

  // 查找并播放系统默认的通知铃声
  async function playDefaultBell() {
    const bellFile = findSystemBell();
    if (!bellFile) return;

    await playAudioFile(bellFile);
  }

  // 触发并执行事件对应的语音/铃声通知播放
  return async function notifyVoice(eventType: string) {
    if (!config.voice.enabled) return;

    const eventCfg = getEventConfig(config.events[eventType]);
    const resolved = resolveVoiceFile(eventCfg);

    if (!resolved.filePath) {
      await playDefaultBell();
      return;
    }

    const played = await playAudioFile(resolved.filePath);
    if (played && resolved.picker && resolved.picked) {
      resolved.picker.afterPlayed(resolved.picked);
    }
  };
}
