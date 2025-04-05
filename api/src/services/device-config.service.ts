import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';
import { PluginConfig } from '../interfaces/plugin.interface';

interface PluginState {
  enabled: boolean;
  schedule: string;
  settings: any;
}

interface DeviceSettings {
  name: string;
  orientation: 'horizontal' | 'vertical';
  timezone: string;
  plugin_cycle_interval_seconds: number;
  plugins: Record<string, PluginState>;
}

export class DeviceConfig {
  private configPath: string;
  private configDir: string;
  private settings: DeviceSettings;

  constructor() {
    this.configDir = path.join(process.cwd(), 'config');
    this.configPath = path.join(this.configDir, 'device.json');
    this.settings = this.loadConfig();
  }

  private loadConfig(): DeviceSettings {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      logger.error('Error loading device config:', error);
    }

    // Default settings
    return {
      name: 'InkyPi',
      orientation: 'horizontal',
      timezone: 'America/New_York',
      plugin_cycle_interval_seconds: 3600,
      plugins: {}
    };
  }

  async getConfig(): Promise<DeviceSettings> {
    return this.settings;
  }

  async updateConfig(newSettings: Partial<DeviceSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    try {
      // Ensure config directory exists
      if (!fs.existsSync(this.configDir)) {
        fs.mkdirSync(this.configDir, { recursive: true });
      }
      fs.writeFileSync(this.configPath, JSON.stringify(this.settings, null, 2));
    } catch (error) {
      logger.error('Error saving device config:', error);
      throw new Error('Failed to save device settings');
    }
  }

  async getPluginState(pluginId: string): Promise<PluginState | null> {
    return this.settings.plugins[pluginId] || null;
  }

  async updatePluginState(pluginId: string, state: Partial<PluginState>): Promise<void> {
    this.settings.plugins[pluginId] = {
      ...(this.settings.plugins[pluginId] || {}),
      ...state
    };
    await this.updateConfig({});
  }
} 