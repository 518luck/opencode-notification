import type { NotificationConfig } from "./types";

// 事件消息定义
export const EVENT_MESSAGES: Record<string, string> = {
  "permission.asked": "需要权限确认，请查看终端", // v2
  "permission.updated": "需要权限确认，请查看终端",
  "question.asked": "OpenCode 有问题需要你回答", // v2
  "session.idle": "任务完成，等待你的输入",
  "session.error": "会话出错，请检查",
};

// 事件→图标映射（icon: 小图标 -i, image: 大图 -h string:image-path）
export const EVENT_ICONS: Record<string, string> = {
  "permission.asked": "permission",
  "permission.updated": "permission",
  "question.asked": "choice",
  "session.idle": "accomplish",
  "session.error": "error",
};

// 图片后缀白名单
export const IMAGE_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".svg",
  ".gif",
  ".webp",
];

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

// 音频播放器候选列表，配置的 player 不可用时会按顺序自动回退
export const AUDIO_PLAYER_CANDIDATES = [
  "pw-play",
  "paplay",
  "aplay",
  "ffplay",
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
  enabled: true, // 总开关，false 时禁用所有通知通道（桌面、Toast、声音）
  desktop: { enabled: true, showImage: true, imageDecayFactor: 0.7, appName: "OpenCode" }, // 桌面通知开关 + 是否显示左侧大图 + 图片随机权重衰减因子 + 应用名称
  toast: { enabled: true, variant: "info" }, // TUI Toast 开关 + 样式（info/success/error）
  voice: {
    enabled: true, // 声音通知开关
    player: "pw-play", // 首选音频播放器；找不到时自动回退到候选播放器
    decayFactor: 0.7, // 事件语音目录的权重衰减系数（0~1，越小衰减越快）
  },
  events: { // 按事件类型单独配置，enabled=是否通知，icon/image/voice=自定义资源路径（可选）
    "permission.asked": { enabled: true, voice: "assets/sound/permission/" }, // v2
    "permission.updated": { enabled: true, voice: "assets/sound/permission/" },
    "question.asked": { enabled: true, voice: "assets/sound/question/" }, // v2
    "session.idle": { enabled: true, voice: "assets/sound/session-idle/" },
    "session.error": { enabled: true, voice: "assets/sound/session-error/" },
  },
};
