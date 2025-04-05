export interface PluginSettings {
  [key: string]: any;
}

export interface PluginConfig {
  id: string;
  displayName: string;
  description: string;
  version: string;
  enabled: boolean;
  schedule: string;
  icon: string;
  settings: { [key: string]: any };
  settingsSchema: SettingDefinition[];
}

export interface SettingDefinition {
  key: string;
  type: 'boolean' | 'string' | 'number' | 'select' | 'location';
  label: string;
  description?: string;
  default?: any;
  options?: SelectOption[]; // For select type
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface LocationValue {
  lat: number;
  lon: number;
  displayName: string;
  customName?: string;  // Optional custom name that overrides displayName
} 