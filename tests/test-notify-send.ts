import { $ } from "bun";

const tests = [
  {
    name: "1. 基础通知（只有标题+正文）",
    cmd: ["notify-send", "OpenCode", "基础通知"],
  },
  {
    name: "2. 紧急程度 - low",
    cmd: ["notify-send", "-u", "low", "OpenCode", "紧急程度: LOW"],
  },
  {
    name: "3. 紧急程度 - normal",
    cmd: ["notify-send", "-u", "normal", "OpenCode", "紧急程度: NORMAL"],
  },
  {
    name: "4. 紧急程度 - critical",
    cmd: ["notify-send", "-u", "critical", "OpenCode", "紧急程度: CRITICAL"],
  },
  {
    name: "5. 带超时 2秒",
    cmd: ["notify-send", "-t", "2000", "OpenCode", "这条2秒后消失"],
  },
  {
    name: "6. 带超时 10秒",
    cmd: ["notify-send", "-t", "10000", "OpenCode", "这条10秒后消失"],
  },
  {
    name: "7. 图标 - dialog-information",
    cmd: [
      "notify-send",
      "-i",
      "dialog-information",
      "OpenCode",
      "图标: dialog-information",
    ],
  },
  {
    name: "8. 图标 - dialog-warning",
    cmd: [
      "notify-send",
      "-i",
      "dialog-warning",
      "OpenCode",
      "图标: dialog-warning",
    ],
  },
  {
    name: "9. 图标 - dialog-error",
    cmd: [
      "notify-send",
      "-i",
      "dialog-error",
      "OpenCode",
      "图标: dialog-error",
    ],
  },
  {
    name: "10. 图标 - dialog-question",
    cmd: [
      "notify-send",
      "-i",
      "dialog-question",
      "OpenCode",
      "图标: dialog-question",
    ],
  },
  {
    name: "11. 图标 - utilities-terminal",
    cmd: [
      "notify-send",
      "-i",
      "utilities-terminal",
      "OpenCode",
      "图标: utilities-terminal",
    ],
  },
  {
    name: "12. 图标 - accessories-text-editor",
    cmd: [
      "notify-send",
      "-i",
      "accessories-text-editor",
      "OpenCode",
      "图标: accessories-text-editor",
    ],
  },
  {
    name: "13. 图标 - system-run",
    cmd: ["notify-send", "-i", "system-run", "OpenCode", "图标: system-run"],
  },
  {
    name: "14. 指定应用名",
    cmd: [
      "notify-send",
      "-a",
      "MyTestApp",
      "测试应用",
      "这个通知来自 MyTestApp",
    ],
  },
  {
    name: "15. 分类",
    cmd: ["notify-send", "-c", "im.received", "OpenCode", "分类: im.received"],
  },
  {
    name: "16. 组合：图标 + 紧急 + 超时",
    cmd: [
      "notify-send",
      "-u",
      "critical",
      "-t",
      "5000",
      "-i",
      "dialog-warning",
      "OpenCode",
      "组合: critical + warning图标 + 5秒",
    ],
  },
];

console.log("开始测试 notify-send，共", tests.length, "项");
console.log("每项间隔 2.5 秒，请观察桌面通知\n");

for (const test of tests) {
  console.log(test.name);
  const proc = Bun.spawn(test.cmd, { stderr: "pipe" });
  await proc.exited;
  if (proc.exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    console.log("  ⚠ 失败:", stderr.trim());
  }
  await new Promise((r) => setTimeout(r, 2500));
}

console.log("\n全部测试完成！");
