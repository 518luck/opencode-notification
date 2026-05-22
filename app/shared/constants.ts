import type { NotificationConfig } from "./types";

// 事件消息定义
export const EVENT_MESSAGES: Record<string, string> = {
  "permission.asked": "需要权限确认，请查看终端", // v2
  "permission.updated": "需要权限确认，请查看终端",
  "question.asked": "OpenCode 有问题需要你回答", // v2
  "session.idle": "任务完成，等待你的输入",
  "session.error": "会话出错，请检查",
};

// 音频后缀白名单
export const AUDIO_EXTENSIONS = [
  ".wav",
  ".ogg",
  ".oga",
  ".mp3",
  ".flac",
  ".aac",
  ".m4a",
  ".opus",
];

// 系统声音查找目录（白名单），用于适配不同 Linux 发行版和桌面环境的音频路径
export const SYSTEM_SOUND_PATHS = [
  "/usr/share/sounds/",
  "/usr/share/sounds/freedesktop/",
  "/usr/share/sounds/freedesktop/stereo/",
];

// 优先匹配的系统默认铃声文件名（白名单），与上述目录拼接进行精准探测，未命中时则降级扫描目录下的其他音频
export const SYSTEM_BELL_FILES = [
  "bell.oga",
  "bell.wav",
  "complete.oga",
  "message-new-instant.oga",
  "message.oga",
  "dialog-information.oga",
  "dialog-warning.oga",
];

// 默认配置
export const DEFAULT_CONFIG: NotificationConfig = {
  enabled: true,
  desktop: { enabled: true },
  toast: { enabled: true, variant: "info" },
  voice: {
    enabled: true,
    mode: "custom",
    player: "paplay",
    decayFactor: 0.7,
    defaultBell: { enabled: false },
    customVoice: { enabled: true, musicsDir: "assets/sound" },
  },
  events: {
    "permission.asked": true, // v2
    "permission.updated": true,
    "question.asked": true, // v2
    "session.idle": true,
    "session.error": true,
  },
};
