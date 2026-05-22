import type { Plugin } from "@opencode-ai/plugin";
import { createNotificationPlugin } from "./src/plugin";

export const NotificationPlugin: Plugin = createNotificationPlugin(import.meta.dir);

export default NotificationPlugin;
