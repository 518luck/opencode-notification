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
- **npm 安装**：一条命令安装，通过 `opencode.json` 配置

## 安装

### 1. 系统依赖

```bash
# Debian/Ubuntu
sudo apt install libnotify-bin pipewire-utils

# Arch
sudo pacman -S libnotify pipewire-utils
```

音频播放器至少安装其一：`pw-play`（推荐）、`paplay`、`aplay`、`ffplay`。

### 2. 安装插件

```bash
npm install @duoyun/opencode-notification
# 或
pnpm add @duoyun/opencode-notification
```

### 3. 配置 opencode

在 `opencode.json` 中添加插件：

```jsonc
{
  "plugin": [
    // 使用默认配置（开箱即用）
    "@duoyun/opencode-notification"
  ]
}
```

自定义配置：

```jsonc
{
  "plugin": [
    ["@duoyun/opencode-notification", {
      // 总开关，false 时禁用所有通知通道
      "enabled": true,

      "desktop": {
        "enabled": true,
        "showImage": true,
        "imageDecayFactor": 0.7,
        "appName": "OpenCode"
      },

      "toast": {
        "enabled": true,
        "variant": "info"
      },

      "voice": {
        "enabled": true,
        "player": "pw-play",
        "decayFactor": 0.7
      },

      "events": {
        "session.idle": {
          "enabled": true,
          "image": "my-assets/idle/",
          "voice": "my-assets/sounds/idle/"
        }
      }
    }]
  ]
}
```

### 4. 重启 opencode

## 配置参考

### 顶层字段

| 字段 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `enabled` | boolean | `true` | 总开关，false 时禁用所有通知通道 |
| `desktop` | object | 见下方 | 桌面通知配置 |
| `toast` | object | 见下方 | TUI Toast 配置 |
| `voice` | object | 见下方 | 语音铃声配置 |
| `events` | object | 见下方 | 按事件类型单独配置 |

### desktop

| 字段 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `enabled` | boolean | `true` | 是否启用桌面通知 |
| `showImage` | boolean | `true` | 是否显示左侧大图 |
| `imageDecayFactor` | number | `0.7` | 图片随机权重衰减因子（0~1） |
| `appName` | string | `"OpenCode"` | 显示在系统通知中心的应用名称 |

### toast

| 字段 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `enabled` | boolean | `true` | 是否启用 TUI Toast |
| `variant` | string | `"info"` | 样式：`info` / `success` / `error` |

### voice

| 字段 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `enabled` | boolean | `true` | 是否启用语音铃声 |
| `player` | string | `"pw-play"` | 首选音频播放器 |
| `decayFactor` | number | `0.7` | 音频权重衰减因子（0~1） |

### events

每个事件可配置：

| 字段 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `enabled` | boolean | `true` | 该事件是否通知 |
| `icon` | string? | 自动 | 小图标路径 |
| `image` | string? | 自动 | 大图路径 |
| `voice` | string? | 插件内置音频 | 音频路径 |

### 路径写法

`icon`、`image`、`voice` 的值支持三种写法：

```jsonc
// 1. 绝对路径：直接使用
"voice": "/home/user/sounds/bell.mp3"

// 2. 相对路径：优先查找项目目录，未找到则回退到插件内置资源
"voice": "assets/sound/session-idle/"

// 3. 不填：使用默认映射（icon/image）或插件内置音频（voice）
```

当路径指向文件夹时，会随机选取其中一个文件（带权重衰减）。

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
