import { existsSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { AUDIO_EXTENSIONS } from "../../../shared/constants";

export class WeightManager {
  private weightsPath: string;
  private weights: Record<string, number> = {};
  private played: Set<string> = new Set();
  private files: string[] = [];
  private decayFactor: number;

  // 构造函数，配置权重存储路径与衰减因子，并加载音频文件和权重数据
  constructor(musicsDir: string, decayFactor: number) {
    this.weightsPath = join(musicsDir, ".weights.json");
    this.decayFactor = decayFactor;
    this.loadFiles(musicsDir);
    this.loadWeights();
  }

  // 扫描音乐目录并筛选出支持的音频文件列表
  private loadFiles(dir: string) {
    if (!existsSync(dir)) return;
    const entries = readdirSync(dir);
    this.files = entries.filter((file) =>
      AUDIO_EXTENSIONS.some((ext) => file.toLowerCase().endsWith(ext)),
    );
  }

  // 加载本地存储的音频权重，若文件不存在或读取失败则执行初始化
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

  // 初始化所有音频文件的权重为默认值（100），并清空已播放状态
  private initWeights() {
    this.weights = {};
    this.played = new Set();
    for (const file of this.files) {
      this.weights[file] = 100;
    }
  }

  // 按权重比率随机挑选一个音频文件，若总权重异常则重置后重新挑选
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
      if (random <= 0) {
        return file;
      }
    }

    return this.files[this.files.length - 1];
  }

  // 播放完成后衰减当前音频权重，记录已播放状态，全部播放后自动重置并保存权重
  afterPlayed(file: string) {
    if (this.files.length === 0) return;
    this.weights[file] = (this.weights[file] || 100) * this.decayFactor;
    this.played.add(file);

    if (this.played.size >= this.files.length) {
      this.initWeights();
    }

    this.saveWeights();
  }

  // 将当前的音频权重和已播放状态持久化保存到本地 JSON 文件中
  private saveWeights() {
    const data = {
      weights: this.weights,
      played: Array.from(this.played),
    };
    writeFileSync(this.weightsPath, JSON.stringify(data, null, 2));
  }

  // 获取当前扫描过滤出的音频文件列表
  getFiles(): string[] {
    return this.files;
  }
}
