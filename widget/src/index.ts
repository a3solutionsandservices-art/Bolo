import { VaaniConfig, VaaniCommand } from "./types";
import { VaaniWidgetInstance } from "./VaaniWidget";

type QueuedCommand = [VaaniCommand, ...unknown[]];

let instance: VaaniWidgetInstance | null = null;

function vaani(command: VaaniCommand, ...args: unknown[]): void {
  if (command === "init") {
    const config = args[0] as VaaniConfig;
    if (!config?.tenantId) {
      console.error("[Bolo] tenantId is required");
      return;
    }
    instance = new VaaniWidgetInstance(config);
    config.onReady?.();

    const win = window as unknown as { vaani?: { q?: QueuedCommand[] } };
    const queue = win.vaani?.q || [];
    queue.forEach(([cmd, ...qArgs]: QueuedCommand) => {
      if (cmd !== "init") vaani(cmd, ...qArgs);
    });
    return;
  }

  if (!instance) {
    console.warn("[Bolo] Widget not initialized. Call vaani('init', config) first.");
    return;
  }

  switch (command) {
    case "open":
      instance.open();
      break;
    case "close":
      instance.close();
      break;
    case "destroy":
      instance.destroy();
      instance = null;
      break;
    case "setLanguage":
      instance.setLanguage(args[0] as string);
      break;
    default:
      console.warn(`[Bolo] Unknown command: ${command}`);
  }
}

(window as unknown as Record<string, unknown>)["vaani"] = vaani;

export default vaani;
