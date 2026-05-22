import { join } from "path";
import { AUDIO_EXTENSIONS } from "../../../shared/constants";
import { WeightedPicker } from "../../../shared/utils";

export class WeightManager {
  private picker: WeightedPicker;
  private dir: string;

  constructor(musicsDir: string, decayFactor: number) {
    this.dir = musicsDir;
    this.picker = new WeightedPicker(musicsDir, AUDIO_EXTENSIONS, decayFactor);
  }

  pick(): string | null {
    return this.picker.pick();
  }

  afterPlayed(file: string) {
    this.picker.afterPlayed(file);
  }

  getFiles(): string[] {
    return this.picker.getFiles();
  }

  getDir(): string {
    return this.dir;
  }
}
