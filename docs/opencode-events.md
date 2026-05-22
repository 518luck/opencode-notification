# opencode Event 总结

本文档整理当前本机安装的 opencode 插件事件类型，主要用于理解 `main.ts` 中返回的 `event` hook 会收到什么。

来源版本：`@opencode-ai/plugin@1.15.7`、`@opencode-ai/sdk@1.15.7`。

类型来源：

```text
/home/duoyun/.opencode/node_modules/@opencode-ai/plugin/dist/index.d.ts
/home/duoyun/.opencode/node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts
/home/duoyun/.opencode/node_modules/@opencode-ai/sdk/dist/v2/gen/types.gen.d.ts
```

## event Hook 形状

插件入口返回的对象里可以注册 `event`：

```ts
export const NotificationPlugin = async (input) => {
  return {
    event: async ({ event }) => {
      // event.type 是事件名称
      // event.properties 是事件携带的数据
    },
  };
};
```

类型定义：

```ts
event?: (input: {
  event: Event;
}) => Promise<void>;
```

概括性中文注解：`event` 是 opencode 的事件总线回调。只要 opencode 内部发出 SDK 事件，这个 hook 就会收到。插件通常根据 `event.type` 过滤自己关心的事件，再读取 `event.properties` 获取事件详情。

## 当前 SDK Event 清单

以下来自 `@opencode-ai/sdk/dist/gen/types.gen.d.ts`，这是当前 `@opencode-ai/plugin` 的 `event` hook 类型直接引用的 `Event` 联合类型。

| 分类         | event.type                      | properties 概要                                                                                                                    | 中文注解                                                     |
| ------------ | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Server       | `server.instance.disposed`      | `{ directory: string }`                                                                                                            | 某个 opencode 实例被释放，通常表示对应目录的服务实例结束。   |
| Server       | `server.connected`              | `{ [key: string]: unknown }`                                                                                                       | 客户端连接到 opencode server。payload 不固定。               |
| Installation | `installation.updated`          | `{ version: string }`                                                                                                              | opencode 安装版本已更新。                                    |
| Installation | `installation.update-available` | `{ version: string }`                                                                                                              | 检测到可更新版本。                                           |
| LSP          | `lsp.client.diagnostics`        | `{ serverID: string; path: string }`                                                                                               | 语言服务器产生诊断信息。                                     |
| LSP          | `lsp.updated`                   | `{ [key: string]: unknown }`                                                                                                       | LSP 状态发生变化。payload 不固定。                           |
| Message      | `message.updated`               | `{ info: Message }`                                                                                                                | 某条消息信息更新。                                           |
| Message      | `message.removed`               | `{ sessionID: string; messageID: string }`                                                                                         | 某条消息被删除。                                             |
| Message      | `message.part.updated`          | `{ part: Part; delta?: string }`                                                                                                   | 消息片段更新，可能包含增量文本。                             |
| Message      | `message.part.removed`          | `{ sessionID: string; messageID: string; partID: string }`                                                                         | 消息片段被删除。                                             |
| Permission   | `permission.updated`            | `Permission`                                                                                                                       | 权限请求对象发生更新。旧类型里是 `permission.updated`。      |
| Permission   | `permission.replied`            | `{ sessionID: string; permissionID: string; response: string }`                                                                    | 用户对权限请求做出回复。                                     |
| Session      | `session.status`                | `{ sessionID: string; status: SessionStatus }`                                                                                     | 会话状态变化，`status.type` 可能是 `idle`、`busy`、`retry`。 |
| Session      | `session.idle`                  | `{ sessionID: string }`                                                                                                            | 会话进入空闲状态，常用于“任务完成”通知。                     |
| Session      | `session.compacted`             | `{ sessionID: string }`                                                                                                            | 会话完成上下文压缩。                                         |
| Session      | `session.created`               | `{ info: Session }`                                                                                                                | 新会话创建。                                                 |
| Session      | `session.updated`               | `{ info: Session }`                                                                                                                | 会话元信息更新，例如标题、时间、分享状态等。                 |
| Session      | `session.deleted`               | `{ info: Session }`                                                                                                                | 会话被删除。                                                 |
| Session      | `session.diff`                  | `{ sessionID: string; diff: Array<FileDiff> }`                                                                                     | 会话产生文件 diff。                                          |
| Session      | `session.error`                 | `{ sessionID?: string; error?: ProviderAuthError 或 UnknownError 或 MessageOutputLengthError 或 MessageAbortedError 或 ApiError }` | 会话出错，适合做错误通知。                                   |
| File         | `file.edited`                   | `{ file: string }`                                                                                                                 | 文件被 opencode 编辑。                                       |
| File         | `file.watcher.updated`          | `{ file: string; event: "add" 或 "change" 或 "unlink" }`                                                                           | 文件监听器发现文件新增、修改或删除。                         |
| Todo         | `todo.updated`                  | `{ sessionID: string; todos: Array<Todo> }`                                                                                        | Todo 列表更新。                                              |
| Command      | `command.executed`              | `{ name: string; sessionID: string; arguments: string; messageID: string }`                                                        | opencode 命令执行完成。                                      |
| VCS          | `vcs.branch.updated`            | `{ branch?: string }`                                                                                                              | Git 分支变化。                                               |
| TUI          | `tui.prompt.append`             | `{ text: string }`                                                                                                                 | TUI prompt 被追加文本。                                      |
| TUI          | `tui.command.execute`           | `{ command: string }`                                                                                                              | TUI 命令被执行，例如 `session.new`、`prompt.submit`。        |
| TUI          | `tui.toast.show`                | `{ title?: string; message: string; variant: "info" 或 "success" 或 "warning" 或 "error"; duration?: number }`                     | TUI toast 弹出。                                             |
| PTY          | `pty.created`                   | `{ info: Pty }`                                                                                                                    | 伪终端创建。                                                 |
| PTY          | `pty.updated`                   | `{ info: Pty }`                                                                                                                    | 伪终端状态更新。                                             |
| PTY          | `pty.exited`                    | `{ id: string; exitCode: number }`                                                                                                 | 伪终端进程退出。                                             |
| PTY          | `pty.deleted`                   | `{ id: string }`                                                                                                                   | 伪终端记录被删除。                                           |

概括性中文注解：当前插件最适合监听的是 `session.idle`、`session.error`、权限相关事件。`message.*`、`file.*`、`todo.*` 更适合做审计日志或状态同步。`tui.*` 和 `pty.*` 偏 UI/终端内部状态，通知插件通常不需要处理。

## Permission 事件注意点

当前项目里配置的是：

```ts
export const EVENT_MESSAGES: Record<string, string> = {
  "permission.asked": "需要权限确认，请查看终端",
  "session.idle": "任务完成，等待你的输入",
  "session.error": "会话出错，请检查",
};
```

但当前 `sdk/dist/gen/types.gen.d.ts` 里权限请求事件叫：

```text
permission.updated
```

而 `sdk/dist/v2/gen/types.gen.d.ts` 里权限请求事件叫：

```text
permission.asked
```

概括性中文注解：`permission.asked` 更符合官方文档和 v2 类型；`permission.updated` 是当前旧 SDK 类型中的名字。为了兼容不同版本，通知插件可以同时监听 `permission.asked` 和 `permission.updated`。

## v2 Event 补充清单

以下来自 `@opencode-ai/sdk/dist/v2/gen/types.gen.d.ts`。v2 事件多数多了顶层 `id: string`，并且事件种类更多。当前 `@opencode-ai/plugin` 的 `event` 类型不直接引用 v2，但运行时和官方文档可能更接近这些名字。

| 分类       | event.type                | properties 概要                                                                     | 中文注解                                           |
| ---------- | ------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------- |
| Global     | `global.disposed`         | `{ [key: string]: unknown }`                                                        | 全局资源释放。                                     |
| TUI        | `tui.prompt.append`       | `{ text: string }`                                                                  | prompt 追加文本。                                  |
| TUI        | `tui.command.execute`     | `{ command: string }`                                                               | TUI 命令执行。                                     |
| TUI        | `tui.toast.show`          | `{ title?; message; variant; duration? }`                                           | TUI toast 展示。                                   |
| TUI        | `tui.session.select`      | `{ sessionID: string }`                                                             | TUI 切换到指定 session。                           |
| Message    | `message.part.delta`      | `{ sessionID; messageID; partID; field; delta }`                                    | 消息片段增量更新，比 `message.part.updated` 更细。 |
| Permission | `permission.asked`        | `PermissionRequest`                                                                 | 发起权限请求，适合通知用户去确认。                 |
| Permission | `permission.replied`      | `{ sessionID; requestID; reply: "once" 或 "always" 或 "reject" }`                   | 权限请求被回复。                                   |
| Question   | `question.asked`          | `QuestionRequest`                                                                   | 插件或 agent 向用户提问。                          |
| Question   | `question.replied`        | `QuestionReplied`                                                                   | 用户回答问题。                                     |
| Question   | `question.rejected`       | `QuestionRejected`                                                                  | 用户拒绝或取消问题。                               |
| MCP        | `mcp.tools.changed`       | `{ server: string }`                                                                | 某个 MCP server 的工具列表变化。                   |
| MCP        | `mcp.browser.open.failed` | `{ mcpName: string; url: string }`                                                  | MCP OAuth 或浏览器打开失败。                       |
| Project    | `project.updated`         | `Project`                                                                           | 项目信息更新。                                     |
| Workspace  | `workspace.ready`         | `{ name: string }`                                                                  | workspace 准备完成。                               |
| Workspace  | `workspace.failed`        | `{ message: string }`                                                               | workspace 初始化或连接失败。                       |
| Workspace  | `workspace.status`        | `{ workspaceID; status: "connected" 或 "connecting" 或 "disconnected" 或 "error" }` | workspace 连接状态变化。                           |
| Worktree   | `worktree.ready`          | `{ name: string; branch?: string }`                                                 | worktree 准备完成。                                |
| Worktree   | `worktree.failed`         | `{ message: string }`                                                               | worktree 创建或准备失败。                          |
| Catalog    | `catalog.model.updated`   | `{ model: ModelV2Info }`                                                            | 模型目录里的某个模型信息更新。                     |
| Models     | `models-dev.refreshed`    | `{ [key: string]: unknown }`                                                        | models.dev 数据刷新。                              |
| Account    | `account.added`           | `{ account: AccountV2Info }`                                                        | 账号新增。                                         |
| Account    | `account.removed`         | `{ account: AccountV2Info }`                                                        | 账号移除。                                         |
| Account    | `account.switched`        | `{ serviceID; from?; to? }`                                                         | 当前账号切换。                                     |

概括性中文注解：v2 事件更偏“完整产品状态流”，除了会话和文件，也覆盖账号、workspace、MCP、模型目录等。普通通知插件一般只需要从中挑 `permission.asked`、`session.idle`、`session.error`、`mcp.browser.open.failed` 这类需要用户注意的事件。

## v2 Session.next 事件

`session.next.*` 是 v2 中更细粒度的会话执行过程事件，适合做实时日志、进度条、性能统计或 UI 回放。

| event.type                        | properties 概要                                                   | 中文注解                                 |
| --------------------------------- | ----------------------------------------------------------------- | ---------------------------------------- |
| `session.next.agent.switched`     | `{ timestamp; sessionID; agent }`                                 | 下一步执行 agent 切换。                  |
| `session.next.model.switched`     | `{ timestamp; sessionID; model: { id; providerID; variant } }`    | 下一步执行模型切换。                     |
| `session.next.prompted`           | `{ timestamp; sessionID; prompt }`                                | 用户 prompt 被提交。                     |
| `session.next.synthetic`          | `{ timestamp; sessionID; text }`                                  | 系统合成的用户消息或续写消息。           |
| `session.next.shell.started`      | `{ timestamp; sessionID; callID; command }`                       | shell 命令开始执行。                     |
| `session.next.shell.ended`        | `{ timestamp; sessionID; callID; output }`                        | shell 命令执行结束。                     |
| `session.next.step.started`       | `{ timestamp; sessionID; agent; model; snapshot? }`               | 一次 agent step 开始。                   |
| `session.next.step.ended`         | `{ timestamp; sessionID; finish; cost; tokens; snapshot? }`       | 一次 agent step 结束，包含成本和 token。 |
| `session.next.step.failed`        | `{ timestamp; sessionID; error }`                                 | 一次 agent step 失败。                   |
| `session.next.text.started`       | `{ timestamp; sessionID }`                                        | 文本输出开始。                           |
| `session.next.text.delta`         | `{ timestamp; sessionID; delta }`                                 | 文本输出增量。                           |
| `session.next.text.ended`         | `{ timestamp; sessionID; text }`                                  | 文本输出结束。                           |
| `session.next.reasoning.started`  | `{ timestamp; sessionID; reasoningID }`                           | reasoning 输出开始。                     |
| `session.next.reasoning.delta`    | `{ timestamp; sessionID; reasoningID; delta }`                    | reasoning 输出增量。                     |
| `session.next.reasoning.ended`    | `{ timestamp; sessionID; reasoningID; text }`                     | reasoning 输出结束。                     |
| `session.next.tool.input.started` | `{ timestamp; sessionID; callID; name }`                          | 工具输入开始生成。                       |
| `session.next.tool.input.delta`   | `{ timestamp; sessionID; callID; delta }`                         | 工具输入增量。                           |
| `session.next.tool.input.ended`   | `{ timestamp; sessionID; callID; text }`                          | 工具输入生成结束。                       |
| `session.next.tool.called`        | `{ timestamp; sessionID; callID; tool; input; provider }`         | 工具被调用。                             |
| `session.next.tool.progress`      | `{ timestamp; sessionID; callID; structured; content }`           | 工具执行中间进度。                       |
| `session.next.tool.success`       | `{ timestamp; sessionID; callID; structured; content; provider }` | 工具调用成功。                           |
| `session.next.tool.failed`        | `{ timestamp; sessionID; callID; error; provider }`               | 工具调用失败。                           |
| `session.next.retried`            | `{ timestamp; sessionID; attempt; error }`                        | 模型请求或执行步骤重试。                 |
| `session.next.compaction.started` | `{ timestamp; sessionID; reason: "auto" 或 "manual" }`            | 会话压缩开始。                           |
| `session.next.compaction.delta`   | `{ timestamp; sessionID; text }`                                  | 压缩摘要增量输出。                       |
| `session.next.compaction.ended`   | `{ timestamp; sessionID; text; include? }`                        | 会话压缩结束。                           |

概括性中文注解：`session.next.*` 是最细的执行流水事件。如果只是通知用户“完成了/出错了/需要授权”，不要监听这些；如果要做可视化时间线、token 统计、工具调用记录，可以重点监听它们。

## 命名 Hook 不是 event.type

`@opencode-ai/plugin` 还有很多命名 hook，它们不是 `event` hook 里收到的 `event.type`，而是直接在返回对象里注册：

```ts
return {
  "tool.execute.before": async (input, output) => {},
  "tool.execute.after": async (input, output) => {},
};
```

| Hook 名称                              | input/output 概要                                                                                                        | 中文注解                                |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- |
| `config`                               | `input: Config`                                                                                                          | 初始化时读取/修改合并后的配置。         |
| `chat.message`                         | `input: { sessionID; agent?; model?; messageID?; variant? }`, `output: { message; parts }`                               | 收到新消息后可修改消息和 parts。        |
| `chat.params`                          | `input: { sessionID; agent; model; provider; message }`, `output: { temperature; topP; topK; maxOutputTokens; options }` | 修改发给模型的参数。                    |
| `chat.headers`                         | `input: { sessionID; agent; model; provider; message }`, `output: { headers }`                                           | 修改发给模型 API 的 headers。           |
| `permission.ask`                       | `input: Permission`, `output: { status: "ask" 或 "deny" 或 "allow" }`                                                    | 在权限询问前改变默认权限决策。          |
| `command.execute.before`               | `input: { command; sessionID; arguments }`, `output: { parts }`                                                          | 命令执行前修改注入到会话里的 parts。    |
| `tool.execute.before`                  | `input: { tool; sessionID; callID }`, `output: { args }`                                                                 | 工具执行前修改工具参数。                |
| `tool.execute.after`                   | `input: { tool; sessionID; callID; args }`, `output: { title; output; metadata }`                                        | 工具执行后修改展示标题、输出和元数据。  |
| `tool.definition`                      | `input: { toolID }`, `output: { description; parameters }`                                                               | 修改给模型看的工具描述和参数 schema。   |
| `shell.env`                            | `input: { cwd; sessionID?; callID? }`, `output: { env }`                                                                 | 注入或修改 shell 环境变量。             |
| `experimental.chat.messages.transform` | `output: { messages }`                                                                                                   | 修改发给模型的消息列表。                |
| `experimental.chat.system.transform`   | `input: { sessionID?; model }`, `output: { system }`                                                                     | 修改 system prompt。                    |
| `experimental.session.compacting`      | `input: { sessionID }`, `output: { context; prompt? }`                                                                   | 会话压缩前追加上下文或替换压缩 prompt。 |
| `experimental.compaction.autocontinue` | `input: { sessionID; agent; model; provider; message; overflow }`, `output: { enabled }`                                 | 控制压缩后是否自动继续。                |
| `experimental.text.complete`           | `input: { sessionID; messageID; partID }`, `output: { text }`                                                            | 文本完成后修改文本。                    |

概括性中文注解：`event` hook 是“旁听事件”；命名 hook 是“拦截/修改流程”。通知插件应该优先用 `event`。如果你要改工具参数、权限策略、模型参数，才使用命名 hook。

## 通知插件推荐监听

| 目的             | 推荐事件                                               | 原因                                                                     |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------------------ |
| 任务完成提醒     | `session.idle`                                         | agent 完成当前响应后会进入 idle。 会话进入空闲状态，常用于“任务完成”通知 |
| 错误提醒         | `session.error`                                        | 模型、鉴权、上下文溢出、请求失败等错误都可能走这里。                     |
| 权限确认提醒     | `permission.asked`、`permission.updated`               | 不同版本命名不同，同时监听更稳。                                         |
| MCP 认证失败提醒 | `mcp.browser.open.failed`                              | v2 里可用，适合提醒用户手动打开链接。                                    |
| 长任务进度记录   | `session.next.step.started`、`session.next.step.ended` | v2 细粒度事件，适合日志，不一定适合桌面通知。                            |
| 工具失败提醒     | `session.next.tool.failed`                             | v2 细粒度工具事件，可用于定位具体工具失败。                              |

概括性中文注解：当前项目作为“通知插件”，最小核心事件就是 `session.idle`、`session.error`、`permission.asked/permission.updated`。其他事件可以先记录日志观察，不建议一开始全部通知，否则会产生大量噪音。

## 运行时观察事件

如果想看实际触发了哪些事件，可以临时写日志：

```ts
import { appendFileSync } from "fs";
import { join } from "path";
import { inspect } from "util";

event: async ({ event }) => {
  appendFileSync(
    join(pluginDir, "events.log"),
    `${new Date().toISOString()} ${event.type} ${inspect(event.properties, { depth: 4 })}\n`,
    "utf8",
  );
};
```

概括性中文注解：类型文件能告诉你“理论上有哪些事件”，运行时日志能告诉你“当前操作实际触发了哪些事件”。插件开发时建议先记录 `event.type`，确认事件名后再写通知逻辑。
