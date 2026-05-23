import { existsSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { DEFAULT_CONFIG } from "./constants";
import type { EventConfig, NotificationConfig } from "./types";

export function isEventEnabled(eventConfig: EventConfig | undefined): boolean {
  return eventConfig?.enabled === true;
}

export function getEventConfig(
  eventConfig: EventConfig | undefined,
): EventConfig | null {
  return eventConfig || null;
}

export function scanFiles(dir: string, extensions: string[]): string[] {
  if (!existsSync(dir)) return [];
  try {
    const entries = readdirSync(dir);
    return entries.filter((file) =>
      extensions.some((ext) => file.toLowerCase().endsWith(ext)),
    );
  } catch {
    return [];
  }
}

export class WeightedPicker {
  private weightsPath: string;
  private weights: Record<string, number> = {};
  private played: Set<string> = new Set();
  private files: string[];
  private decayFactor: number;

  constructor(dir: string, extensions: string[], decayFactor: number) {
    this.weightsPath = join(dir, ".weights.json");
    this.decayFactor = decayFactor;
    this.files = scanFiles(dir, extensions);
    this.loadWeights();
  }

  private loadWeights() {
    if (this.files.length === 0) return;

    if (existsSync(this.weightsPath)) {
      try {
        const data = JSON.parse(readFileSync(this.weightsPath, "utf-8"));
        this.weights = data.weights || {};
        this.played = new Set(data.played || []);
      } catch {
        this.initWeights();
      }
    } else {
      this.initWeights();
    }

    for (const file of this.files) {
      if (!(file in this.weights)) {
        this.weights[file] = 100;
      }
    }
  }

  private initWeights() {
    this.weights = {};
    this.played = new Set();
    for (const file of this.files) {
      this.weights[file] = 100;
    }
  }

  pick(): string | null {
    if (this.files.length === 0) return null;

    const totalWeight = this.files.reduce(
      (sum, file) => sum + (this.weights[file] || 0),
      0,
    );
    if (totalWeight <= 0) {
      this.initWeights();
      return this.pick();
    }

    let random = Math.random() * totalWeight;
    for (const file of this.files) {
      random -= this.weights[file] || 0;
      if (random <= 0) return file;
    }

    return this.files[this.files.length - 1];
  }

  afterPlayed(file: string) {
    if (this.files.length === 0) return;
    this.weights[file] = (this.weights[file] || 100) * this.decayFactor;
    this.played.add(file);

    if (this.played.size >= this.files.length) {
      this.initWeights();
    }

    this.saveWeights();
  }

  private saveWeights() {
    const data = {
      weights: this.weights,
      played: Array.from(this.played),
    };
    writeFileSync(this.weightsPath, JSON.stringify(data, null, 2));
  }

  getFiles(): string[] {
    return this.files;
  }
}

function cloneDefaultConfig(): NotificationConfig {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

function stripJsoncComments(content: string): string {
  return content
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/,\s*([}\]])/g, "$1");
}

function findConfigFile(dir: string): string | null {
  const jsoncPath = join(dir, "notification.config.jsonc");
  const jsonPath = join(dir, "notification.config.json");
  if (existsSync(jsoncPath)) return jsoncPath;
  if (existsSync(jsonPath)) return jsonPath;
  return null;
}

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
