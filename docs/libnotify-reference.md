# libnotify (notify-send) 参数参考

## 基本信息

- 包名：`libnotify-bin`（Debian/Ubuntu）、`libnotify`（Arch）
- 命令：`notify-send [选项] <标题> <正文>`
- 协议：[FreeDesktop.org Notification Spec](https://specifications.freedesktop.org/notification-spec/latest/)

## 选项

| 选项 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `-u LEVEL` | string | 紧急程度：`low` / `normal` / `critical` | `-u critical` |
| `-t 毫秒` | int | 超时时间（GNOME 可能忽略） | `-t 5000` |
| `-i NAME_OR_PATH` | string | 小图标，显示在通知顶部 | `-i dialog-warning` |
| `-a APP_NAME` | string | 应用名称 | `-a OpenCode` |
| `-c CATEGORY` | string | 通知分类 | `-c im.received` |
| `-h TYPE:NAME:VALUE` | hint | 附加提示数据（见下表） | `-h string:image-path:...` |
| `-A LABEL` | string | 交互按钮（GNOME 基本无效） | `-A "打开"` |

## 三种图片机制

| 机制 | 设置方式 | 显示位置 | 大小 |
|------|----------|----------|------|
| `app_icon`（-i） | `notify-send -i dialog-info` | 顶部小图标 | 24-48px |
| `image-path` hint | `-h string:image-path:PATH` | **左侧大图片** | 100-200px+ |
| `image-data` hint | 原始 RGBA 像素数据（需 D-Bus 或 Python 绑定） | **左侧大图片** | 任意 |

优先级：`image-data` > `image-path` > `app_icon`

### image-path 示例

```bash
# 文件路径
notify-send -h string:image-path:/path/to/image.png "标题" "正文"

# file:// URI
notify-send -h string:image-path:file:///path/to/image.png "标题" "正文"

# 系统图标主题名
notify-send -h string:image-path:utilities-terminal "标题" "正文"

# 小图标 + 大图片组合
notify-send -i dialog-information -h string:image-path:/path/to/img.png "标题" "正文"
```

支持的图片格式：PNG、SVG、JPG 等 GdkPixbuf 可加载的格式。

## -h hint 数据类型

| TYPE | 说明 | 示例 |
|------|------|------|
| `string:NAME:VALUE` | 字符串 | `-h string:desktop-entry:opencode` |
| `int:NAME:VALUE` | 整数 | `-h int:value:75` |
| `boolean:NAME:VALUE` | 布尔值 | `-h boolean:transient:true` |
| `byte:NAME:VALUE` | 字节（0-255） | `-h byte:urgency:2` |
| `double:NAME:VALUE` | 双精度浮点 | `-h double:value:0.5` |
| `variant:NAME:VALUE` | 变体 | `-h variant:s:hello` |

## 常用 hint 名称

| NAME | TYPE | 说明 | 示例 |
|------|------|------|------|
| `image-path` | string | 左侧大图片路径或图标名 | `-h string:image-path:/tmp/img.png` |
| `image-data` | (iiibiiay) | 原始 RGBA 像素（notify-send 不支持） | 需用 Python gi.repository.Notify |
| `desktop-entry` | string | 关联的 .desktop 文件 | `-h string:desktop-entry:opencode` |
| `transient` | boolean | 不存入通知历史 | `-h boolean:transient:true` |
| `category` | string | 同 -c | `-h string:category:im.received` |
| `urgency` | byte | 同 -u（0=low, 1=normal, 2=critical） | `-h byte:urgency:2` |
| `value` | int | 进度条数值（0-100） | `-h int:value:75` |
| `resident` | boolean | 通知常驻（需守护进程支持） | `-h boolean:resident:true` |

## 常用系统图标名

遵循 [FreeDesktop.org 图标命名规范](https://specifications.freedesktop.org/icon-naming-spec/icon-naming-spec-latest.html)

| 图标名 | 说明 |
|--------|------|
| `dialog-information` | 信息提示 |
| `dialog-warning` | 警告 |
| `dialog-error` | 错误 |
| `dialog-question` | 询问 |
| `utilities-terminal` | 终端 |
| `accessories-text-editor` | 文本编辑器 |
| `system-run` | 运行 |
| `process-stop` | 停止 |
| `task-due` | 任务到期 |
| `mail-unread` | 未读邮件 |
| `mail-read` | 已读邮件 |

## GNOME 环境限制

| 特性 | 是否支持 |
|------|----------|
| `-u` 紧急程度 | ✅ critical 有红色边框 |
| `-i` 顶部小图标 | ✅ |
| `-h string:image-path` 左侧大图 | ✅ |
| `-a` 应用名 | ✅ 显示在通知中心 |
| `-h boolean:transient` 不存历史 | ✅ |
| `-t` 超时 | ❌ GNOME 自行控制时长 |
| 多行正文 (`\n`) | ❌ GNOME 不支持 |
| `-A` 交互按钮 | ❌ GNOME 不支持 |
| body 内 HTML `<img>` | ❌ GNOME 不支持 |

## 在 Bun/TypeScript 中使用

```typescript
// 通过 Bun Shell 执行
await $`notify-send -u ${urgency} -i ${icon} -h string:image-path:${imagePath} "OpenCode" ${message}`.quiet();

// 通过 Bun.spawn 执行
Bun.spawn(["notify-send", "-u", urgency, "-i", icon, "-h", `string:image-path:${imagePath}`, "OpenCode", message]);
```

## Python 方式（支持 image-data 原始像素）

```python
import gi
gi.require_version('Notify', '0.7')
from gi.repository import Notify, GdkPixbuf

Notify.init("OpenCode")

pixbuf = GdkPixbuf.Pixbuf.new_from_file("/path/to/image.png")
notification = Notify.Notification.new("标题", "正文", "dialog-information")
notification.set_image_from_pixbuf(pixbuf)
notification.show()
```

## D-Bus 直接调用（完整控制）

```bash
gdbus call --session \
  --dest org.freedesktop.Notifications \
  --object-path /org/freedesktop/Notifications \
  --method org.freedesktop.Notifications.Notify \
  "MyApp" 0 "dialog-information" "标题" "正文" \
  '[]' \
  '{"image-path": <"/path/to/image.png">}' \
  5000
```
