import type { ConsolePlugin } from "@f2b/console-shell";
import { sandboxPlugin } from "@f2b/plugin-sandbox";

/**
 * 控制台已启用插件列表。
 * 新产品：实现 ConsolePlugin 后 append 于此即可挂侧栏。
 */
export const consolePlugins: ConsolePlugin[] = [sandboxPlugin];
