import type { Plugin } from "@opencode-ai/plugin";
import {
  readdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
} from "fs";
import { join, resolve } from "path";

// 配置文件类型定义
interface NotificationConfig {
  enabled: boolean;
  desktop: { enabled: boolean };
  toast: { enabled: boolean; variant: string };
  voice: {
    enabled: boolean;
    mode: "custom" | "default";
    player: string;
    decayFactor: number;
    defaultBell: { enabled: boolean };
    customVoice: { enabled: boolean; musicsDir: string };
  };
  events: Record<string, boolean>;
}

// 事件对应的通知消息
const EVENT_MESSAGES: Record<string, string> = {
  "permission.asked": "需要权限确认，请查看终端",
  "session.idle": "任务完成，等待你的输入",
  "session.error": "会话出错，请检查",
};

// 支持的音频文件扩展名
const AUDIO_EXTENSIONS = [
  ".wav",
  ".ogg",
  ".oga",
  ".mp3",
  ".flac",
  ".aac",
  ".m4a",
  ".opus",
];

// 系统默认铃声搜索路径
const SYSTEM_SOUND_PATHS = [
  "/usr/share/sounds/",
  "/usr/share/sounds/freedesktop/",
  "/usr/share/sounds/freedesktop/stereo/",
];

// 默认铃声文件名（按优先级）
const SYSTEM_BELL_FILES = [
  "bell.oga",
  "bell.wav",
  "complete.oga",
  "message-new-instant.oga",
  "message.oga",
  "dialog-information.oga",
  "dialog-warning.oga",
];

// 铃声权重管理器
class WeightManager {
  private weightsPath: string;
  private weights: Record<string, number> = {};
  private played: Set<string> = new Set();
  private files: string[] = [];
  private decayFactor: number;

  constructor(musicsDir: string, decayFactor: number) {
    this.weightsPath = join(musicsDir, ".weights.json");
    this.decayFactor = decayFactor;
    this.loadFiles(musicsDir);
    this.loadWeights();
  }

  // 扫描 musics 目录下的音频文件
  private loadFiles(dir: string) {
    if (!existsSync(dir)) return;
    const entries = readdirSync(dir);
    this.files = entries.filter((f) =>
      AUDIO_EXTENSIONS.some((ext) => f.toLowerCase().endsWith(ext)),
    );
    // 没有音频文件时不做任何事
    if (this.files.length === 0) return;
  }

  // 从 .weights.json 加载权重状态
  private loadWeights() {
    if (this.files.length === 0) return;
    if (existsSync(this.weightsPath)) {
      try {
        const data = JSON.parse(readFileSync(this.weightsPath, "utf-8"));
        this.weights = data.weights || {};
        this.played = new Set(data.played || []);
      } catch {
        // 解析失败则重新初始化
        this.initWeights();
      }
    } else {
      this.initWeights();
    }
    // 确保所有文件都有权重
    for (const f of this.files) {
      if (!(f in this.weights)) {
        this.weights[f] = 100;
      }
    }
  }

  // 初始化所有权重为 100
  private initWeights() {
    this.weights = {};
    this.played = new Set();
    for (const f of this.files) {
      this.weights[f] = 100;
    }
  }

  // 加权随机选择一个文件
  pick(): string | null {
    if (this.files.length === 0) return null;

    const totalWeight = this.files.reduce(
      (sum, f) => sum + (this.weights[f] || 0),
      0,
    );
    if (totalWeight <= 0) {
      // 所有权重都为 0，重置
      this.initWeights();
      return this.pick();
    }

    let rand = Math.random() * totalWeight;
    for (const f of this.files) {
      rand -= this.weights[f] || 0;
      if (rand <= 0) {
        return f;
      }
    }
    // 兜底返回最后一个
    return this.files[this.files.length - 1];
  }

  // 播放后衰减权重
  afterPlayed(file: string) {
    if (this.files.length === 0) return;
    this.weights[file] = (this.weights[file] || 100) * this.decayFactor;
    this.played.add(file);

    // 所有文件都播放过则重置
    if (this.played.size >= this.files.length) {
      this.initWeights();
    }

    this.saveWeights();
  }

  // 持久化权重到 .weights.json
  private saveWeights() {
    const data = {
      weights: this.weights,
      played: Array.from(this.played),
    };
    writeFileSync(this.weightsPath, JSON.stringify(data, null, 2));
  }

  getFiles(): string[] {
    return this.files;
  }
}

// 去除 JSONC 中的注释和尾逗号，使其可被 JSON.parse 解析
function stripJsoncComments(content: string): string {
  return content
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/,\s*([}\]])/g, "$1");
}

// 查找配置文件（支持 .jsonc 和 .json）
function findConfigFile(dir: string): string | null {
  const jsoncPath = join(dir, "notification.config.jsonc");
  const jsonPath = join(dir, "notification.config.json");
  if (existsSync(jsoncPath)) return jsoncPath;
  if (existsSync(jsonPath)) return jsonPath;
  return null;
}

// 查找系统默认铃声
function findSystemBell(): string | null {
  for (const dir of SYSTEM_SOUND_PATHS) {
    if (!existsSync(dir)) continue;
    // 先按优先文件名查找
    for (const name of SYSTEM_BELL_FILES) {
      const fullPath = join(dir, name);
      if (existsSync(fullPath)) return fullPath;
    }
    // 再查找目录下任意音频文件
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

export const NotificationPlugin: Plugin = async ({
  $,
  directory,
  worktree,
}) => {
  // 使用 import.meta.dir 获取插件文件实际所在目录（支持软链接）
  const pluginDir = import.meta.dir;
  const configPath = findConfigFile(pluginDir);

  // 读取配置文件
  let config: NotificationConfig;
  try {
    if (!configPath) throw new Error("config not found");
    const raw = readFileSync(configPath, "utf-8");
    config = JSON.parse(stripJsoncComments(raw));
  } catch {
    // 配置文件读取失败，使用默认配置
    config = {
      enabled: true,
      desktop: { enabled: true },
      toast: { enabled: true, variant: "info" },
      voice: {
        enabled: true,
        mode: "custom",
        player: "paplay",
        decayFactor: 0.7,
        defaultBell: { enabled: false },
        customVoice: { enabled: true, musicsDir: "musics" },
      },
      events: {
        "permission.asked": true,
        "session.idle": true,
        "session.error": true,
      },
    };
  }

  // 初始化铃声权重管理器
  const musicsDir = join(
    pluginDir,
    config.voice.customVoice.musicsDir || "musics",
  );
  if (!existsSync(musicsDir)) {
    mkdirSync(musicsDir, { recursive: true });
  }
  const weightManager = new WeightManager(
    musicsDir,
    config.voice.decayFactor || 0.7,
  );

  // 发送桌面弹窗通知
  async function sendDesktopNotification(message: string) {
    if (!config.desktop.enabled) return;
    try {
      await $`notify-send "OpenCode" ${message}`.quiet();
    } catch {
      // notify-send 不可用时静默忽略
    }
  }

  // 发送 TUI Toast 通知
  async function sendToastNotification(message: string) {
    if (!config.toast.enabled) return;
    try {
      await $`opencode tui toast ${message}`.quiet().nothrow();
    } catch {
      // TUI Toast 不可用时静默忽略
    }
  }

  // 播放自定义铃声
  async function playCustomVoice() {
    if (!config.voice.customVoice.enabled) return;
    if (weightManager.getFiles().length === 0) return;

    const picked = weightManager.pick();
    if (!picked) return;

    const filePath = join(musicsDir, picked);
    const player = config.voice.player || "paplay";

    try {
      // 后台播放音频
      await $`${player} ${filePath}`.quiet().nothrow();
    } catch {
      // 播放失败时静默忽略
    }

    // 衰减权重
    weightManager.afterPlayed(picked);
  }

  // 播放系统默认铃声
  async function playDefaultBell() {
    if (!config.voice.defaultBell.enabled) return;
    const bellFile = findSystemBell();
    if (!bellFile) return;

    const player = config.voice.player || "paplay";
    try {
      await $`${player} ${bellFile}`.quiet().nothrow();
    } catch {
      // 播放失败时静默忽略
    }
  }

  // 统一通知分发
  async function notify(eventType: string) {
    // 总开关检查
    if (!config.enabled) return;
    // 事件开关检查
    if (!config.events[eventType]) return;

    const message = EVENT_MESSAGES[eventType] || "OpenCode 通知";

    // 桌面弹窗
    await sendDesktopNotification(message);

    // TUI Toast
    await sendToastNotification(message);

    // 语音通知
    if (config.voice.enabled) {
      if (config.voice.mode === "custom") {
        await playCustomVoice();
      }
      if (config.voice.mode === "default" || config.voice.defaultBell.enabled) {
        await playDefaultBell();
      }
    }
  }

  // 返回事件钩子
  return {
    event: async ({ event }: { event: { type: string } }) => {
      const eventType = event.type;
      if (eventType in EVENT_MESSAGES) {
        await notify(eventType);
      }
    },
  };
};
