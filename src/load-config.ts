import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { DEFAULT_CONFIG } from "./constants";
import type { NotificationConfig } from "./types";

// 深拷贝并返回默认配置对象
function cloneDefaultConfig(): NotificationConfig {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

// 移除 JSONC 字符串中的单行/多行注释和尾随逗号以符合标准 JSON 格式
function stripJsoncComments(content: string): string {
  return content
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/,\s*([}\]])/g, "$1");
}

// 检索插件目录下的配置文件路径（优先匹配 .jsonc）
function findConfigFile(dir: string): string | null {
  const jsoncPath = join(dir, "notification.config.jsonc");
  const jsonPath = join(dir, "notification.config.json");
  if (existsSync(jsoncPath)) return jsoncPath;
  if (existsSync(jsonPath)) return jsonPath;
  return null;
}

// 加载并解析配置文件，读取失败时降级返回默认配置
export function loadNotificationConfig(pluginDir: string): NotificationConfig {
  try {
    const configPath = findConfigFile(pluginDir);
    if (!configPath) throw new Error("config not found");

    const raw = readFileSync(configPath, "utf-8");
    return JSON.parse(stripJsoncComments(raw));
  } catch {
    return cloneDefaultConfig();
  }
}
