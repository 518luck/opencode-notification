export interface EventConfig {
  enabled: boolean;
  icon?: string;
  image?: string;
}

export interface NotificationConfig {
  enabled: boolean;
  desktop: { enabled: boolean; showImage: boolean; imageDecayFactor: number };
  toast: { enabled: boolean; variant: string };
  voice: {
    enabled: boolean;
    mode: "custom" | "default";
    player: string;
    decayFactor: number;
    defaultBell: { enabled: boolean };
    customVoice: { enabled: boolean; musicsDir: string };
  };
  events: Record<string, boolean | EventConfig>;
}
