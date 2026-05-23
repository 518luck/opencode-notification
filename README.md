# OpenCode 通知插件

监听 OpenCode 系统事件，通过**桌面通知**、**TUI Toast 弹窗**、**语音铃声**三种通道提醒用户。

## 功能特性

| 通道 | 实现 | 说明 |
|------|------|------|
| 桌面通知 | `notify-send` | 支持小图标（`-i`）+ 左侧大图（`-h string:image-path`） |
| TUI 弹窗 | `client.tui.showToast()` | 编辑器内部提示，支持 info/success/error 样式 |
| 语音铃声 | `pw-play` / `paplay` / `aplay` / `ffplay` | 按事件独立目录，权重随机播放，自动回退系统铃声 |

- **Per-event 配置**：每个事件可独立配置图标、图片、语音路径
- **权重随机 + 衰减**：文件夹模式下，避免重复播放同一文件
- **播放器自动回退**：`pw-play` → `paplay` → `aplay` → `ffplay`，找到可用播放器后记住
- **JSONC 配置**：支持注释和尾随逗号

## 安装

### 1. 系统依赖

```bash
# Debian/Ubuntu
sudo apt install libnotify-bin pipewire-utils

# Arch
sudo pacman -S libnotify pipewire-utils
```

音频播放器至少安装其一：`pw-play`（推荐）、`paplay`、`aplay`、`ffplay`。

### 2. 部署插件

```bash
# 克隆仓库
git clone <repo-url> /path/to/opencode-notification

# 创建软链接到 opencode 插件目录
ln -s /path/to/opencode-notification ~/.config/opencode/plugins/notification

# 创建配置文件
cp notification.config.example.jsonc notification.config.jsonc
```

### 3. 重启 opencode

## 配置参考

完整配置文件 `notification.config.jsonc`：

```jsonc
{
  // 总开关，false 时禁用所有通知通道
  "enabled": true,

  // 桌面弹窗通知（notify-send）
  "desktop": {
    "enabled": true,
    // 是否显示左侧大图
    "showImage": true,
    // 图片随机权重衰减因子（0~1，越小衰减越快）
    "imageDecayFactor": 0.7,
    // 应用名称（显示在系统通知中心）
    "appName": "OpenCode"
  },

  // TUI 内部 Toast 提示
  "toast": {
    "enabled": true,
    // 样式：info / success / error
    "variant": "info"
  },

  // 语音铃声通知
  "voice": {
    "enabled": true,
    // 首选播放器：pw-play / paplay / aplay / ffplay
    "player": "pw-play",
    // 音频权重衰减因子（0~1）
    "decayFactor": 0.7
  },

  // 按事件类型单独配置
  "events": {
    "permission.asked": {
      "enabled": true,
      "voice": "assets/sound/permission/"
    },
    "permission.updated": {
      "enabled": true,
      "voice": "assets/sound/permission/"
    },
    "question.asked": {
      "enabled": true,
      "voice": "assets/sound/question/"
    },
    "session.idle": {
      "enabled": true,
      "voice": "assets/sound/session-idle/"
    },
    "session.error": {
      "enabled": true,
      "voice": "assets/sound/session-error/"
    }
  }
}
```

### 事件配置字段

| 字段 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `enabled` | boolean | `true` | 该事件是否通知 |
| `icon` | string? | 自动 | 小图标路径，支持文件/文件夹/不填 |
| `image` | string? | 自动 | 大图路径，支持文件/文件夹/不填 |
| `voice` | string? | 系统铃声 | 音频路径，支持文件/文件夹/不填 |

### 路径三种写法

```jsonc
// 1. 单文件：直接使用
"icon": "assets/icons/permission.svg"

// 2. 文件夹：随机选取（带权重衰减）
"image": "assets/pictures/climax/"

// 3. 不填：使用默认映射（icon/image）或系统铃声（voice）
"icon": undefined  // → assets/icons/{eventName}.svg
"voice": undefined // → 系统默认铃声
```

### 支持的扩展名

| 类型 | 扩展名 |
|------|--------|
| 图片 | `.png` `.jpg` `.jpeg` `.svg` `.gif` `.webp` |
| 音频 | `.wav` `.ogg` `.oga` `.mp3` `.flac` `.aac` `.m4a` `.opus` |

## 支持的事件

| 事件 | 消息 | 默认图标 |
|------|------|----------|
| `permission.asked` | 需要权限确认，请查看终端 | `permission` |
| `permission.updated` | 需要权限确认，请查看终端 | `permission` |
| `question.asked` | OpenCode 有问题需要你回答 | `choice` |
| `session.idle` | 任务完成，等待你的输入 | `accomplish` |
| `session.error` | 会话出错，请检查 | `error` |

## 目录结构

```
opencode-notification/
├── main.ts                    # 插件入口
├── notification.config.jsonc  # 配置文件（gitignored）
├── notification.config.example.jsonc  # 配置示例
│
├── app/
│   ├── shared/
│   │   ├── types.ts           # 配置类型接口
│   │   ├── constants.ts       # 常量定义 + 默认配置
│   │   └── utils.ts           # 配置加载 + WeightedPicker
│   └── features/
│       ├── notifier/
│       │   ├── index.ts       # 通知分发中心
│       │   ├── desktop.ts     # 桌面通知
│       │   └── toast.ts       # TUI 弹窗
│       └── sound/
│           └── sound.ts       # 语音铃声
│
├── assets/
│   ├── icons/                 # 默认 SVG 图标
│   │   ├── accomplish.svg
│   │   ├── choice.svg
│   │   ├── error.svg
│   │   └── permission.svg
│   ├── pictures/              # 大图素材（gitignored）
│   └── sound/                 # 音频素材（gitignored）
│       ├── permission/        # 权限事件音频
│       ├── question/          # 提问事件音频
│       ├── session-idle/      # 空闲事件音频
│       └── session-error/     # 错误事件音频
│
└── docs/                      # 文档
    └── libnotify-reference.md # notify-send 参数参考
```

## 权重随机机制

当 `icon`、`image`、`voice` 指向文件夹时，使用 `WeightedPicker` 选择文件：

1. 所有文件初始权重为 **100**
2. 每次选中后，该文件权重 × `decayFactor`（衰减）
3. 权重数据持久化到文件夹内的 `.weights.json`
4. 所有文件都被播放过后，权重重置为 100

## 播放器回退策略

音频播放时按以下顺序查找可用播放器：

```
配置的 player → pw-play → paplay → aplay → ffplay
```

找到可用播放器后会在本次运行中记住，后续通知直接复用。

## 依赖

| 类型 | 包 |
|------|-----|
| 运行时 | Bun |
| SDK | `@opencode-ai/plugin` |
| 系统 | `notify-send`（libnotify）、音频播放器 |
