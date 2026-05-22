export interface NotificationConfig {
  enabled: boolean;
  desktop: { enabled: boolean };
  toast: { enabled: boolean; variant: string };
  voice: {
    enabled: boolean;
    mode: "custom" | "default";
    player: string;
    decayFactor: number;
    defaultBell: { enabled: boolean };
    customVoice: { enabled: boolean; musicsDir: string };
  };
  events: Record<string, boolean>;
}
