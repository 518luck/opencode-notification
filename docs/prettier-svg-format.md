# VSCode 中使用 Prettier 格式化 SVG 文件

## 背景

Prettier 没有内置 SVG 解析器，所以安装 Prettier 扩展后，在 `.svg` 文件中右键看不到"格式化文档"选项。需要通过配置让 Prettier 用 `html` 解析器来处理 SVG。

## 配置步骤

### 1. 创建 `.prettierrc.json`（项目根目录）

```json
{
  "overrides": [
    // overrides：覆盖特定文件类型的默认配置
    {
      "files": "*.svg", // 匹配所有 .svg 文件
      "options": {
        "parser": "html" // 使用 html 解析器来解析 SVG（SVG 本质是 XML，html 解析器兼容）
      }
    }
  ]
}
```

> 如果项目已有 Prettier 配置文件（`.prettierrc` / `.prettierrc.json` / `prettier.config.js`），只需把 `overrides` 部分追加进去。

### 2. 创建 `.vscode/settings.json`（项目根目录）

```json
{
  "files.associations": {
    // 文件关联配置，告诉 VSCode 如何识别文件类型
    "*.svg": "xml" // 将所有 .svg 文件的语言模式设为 xml（而非默认的 plain text）
  },
  "prettier.documentSelectors": [
    // 指定 Prettier 扩展应该在哪些文件上激活
    "**/*.svg" // 匹配项目中所有目录下的 .svg 文件，注册 Prettier 为候选格式化器
  ],
  "[xml]": {
    // 针对 xml 语言模式的编辑器设置
    "editor.defaultFormatter": "esbenp.prettier-vscode", // 设置 Prettier 扩展为 xml 文件的默认格式化器（esbenp 是扩展作者的用户名）
    "editor.formatOnSave": true // 保存文件时自动格式化（可选，不想要可以删掉）
  }
}
```

> 如果已有 `.vscode/settings.json`，将以上字段合并进去即可。

### 3. 重新打开 SVG 文件

关闭再打开 `.svg` 文件，右键 → "格式化文档" 即可使用。

## 每项配置的作用

| 配置                                 | 作用                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------ |
| `overrides.parser: "html"`           | 让 Prettier 用 HTML 解析器处理 `.svg`（SVG 本质是 XML，HTML 解析器兼容） |
| `files.associations: "*.svg": "xml"` | 让 VSCode 把 `.svg` 文件识别为 `xml` 语言模式                            |
| `prettier.documentSelectors`         | 注册 Prettier 扩展为 `.svg` 文件的候选格式化器                           |
| `[xml].editor.defaultFormatter`      | 指定 `xml` 语言模式下使用 Prettier 作为默认格式化器                      |
| `editor.formatOnSave`                | 保存时自动格式化（可选）                                                 |

## 前置条件

- VSCode 已安装 **Prettier - Code formatter** 扩展（ID: `esbenp.prettier-vscode`）

## 注意事项

- 如果安装了 SVG 专用扩展（如 "SVG" by jock），`.svg` 可能被识别为 `svg` 语言模式而非 `xml`，此时需把 `[xml]` 改为 `[svg]`
- 可以在 VSCode 右下角状态栏确认当前文件的语言模式
- 全局生效：将以上配置放到用户级 `settings.json`（`~/.config/Code/User/settings.json`）中即可
