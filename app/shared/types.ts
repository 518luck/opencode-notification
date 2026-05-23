export interface EventConfig {
  enabled: boolean;
  icon?: string;
  image?: string;
  voice?: string;
}

export interface NotificationConfig {
  enabled: boolean;
  desktop: {
    enabled: boolean;
    showImage: boolean;
    imageDecayFactor: number;
    appName: string;
  };
  toast: { enabled: boolean; variant: string };
  voice: {
    enabled: boolean;
    player: string;
    decayFactor: number;
  };
  events: Record<string, EventConfig>;
}
