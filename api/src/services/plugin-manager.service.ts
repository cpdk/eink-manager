import { Plugin, PluginConfig } from '../interfaces/plugin.interface';
import { DisplayService } from './display.service';
import { DeviceConfig } from './device-config.service';
import { logger } from '../utils/logger';
import * as cron from 'node-cron';
import * as path from 'path';
import * as fs from 'fs/promises';

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private displayService: DisplayService;
  private deviceConfig: DeviceConfig;

  constructor(displayService: DisplayService, deviceConfig: DeviceConfig) {
    this.displayService = displayService;
    this.deviceConfig = deviceConfig;
  }

  async registerPlugin(plugin: Plugin): Promise<void> {
    try {
      // Load saved state for this plugin
      const savedState = await this.deviceConfig.getPluginState(plugin.config.id);
      logger.info(`Loading state for plugin ${plugin.config.id}:`, savedState);
      
      if (savedState) {
        // If we have a saved state, use it
        plugin.config.enabled = savedState.enabled;
        plugin.config.schedule = savedState.schedule;
        plugin.config.settings = { ...plugin.config.settings, ...savedState.settings };
        logger.info(`Applied saved state to plugin ${plugin.config.id}:`, {
          enabled: plugin.config.enabled,
          schedule: plugin.config.schedule
        });
      } else {
        // If no saved state, start with disabled
        plugin.config.enabled = false;
        // Save the initial state
        await this.deviceConfig.updatePluginState(plugin.config.id, {
          enabled: false,
          schedule: plugin.config.schedule,
          settings: plugin.config.settings
        });
        logger.info(`No saved state found for plugin ${plugin.config.id}, initialized as disabled`);
      }

      // Check if any other plugin is enabled
      const enabledPlugins = Array.from(this.plugins.values()).filter(p => p.config.enabled);
      if (enabledPlugins.length > 0 && plugin.config.enabled) {
        logger.info(`Disabling plugin ${plugin.config.id} because another plugin is already enabled`);
        plugin.config.enabled = false;
        await this.deviceConfig.updatePluginState(plugin.config.id, { enabled: false });
      }

      await plugin.initialize();
      this.plugins.set(plugin.config.id, plugin);
      
      if (plugin.config.enabled) {
        this.schedulePlugin(plugin);
        logger.info(`Scheduled plugin ${plugin.config.id} with schedule ${plugin.config.schedule}`);
      } else {
        logger.info(`Plugin ${plugin.config.id} is disabled, not scheduling`);
      }
      
      logger.info(`Plugin ${plugin.config.displayName} registered successfully`);
    } catch (error) {
      logger.error(`Failed to register plugin ${plugin.config.displayName}:`, error);
      throw error;
    }
  }

  private schedulePlugin(plugin: Plugin): void {
    const job = cron.schedule(plugin.config.schedule, async () => {
      try {
        logger.info(`Running scheduled task for plugin ${plugin.config.displayName}`);
        const imagePath = await plugin.render();
        await this.displayService.updateDisplay(imagePath);
      } catch (error) {
        logger.error(`Error in scheduled task for plugin ${plugin.config.displayName}:`, error);
      }
    });

    this.jobs.set(plugin.config.id, job);
  }

  async updatePluginSettings(id: string, settings: any): Promise<void> {
    const plugin = this.plugins.get(id);
    if (!plugin) {
      throw new Error('Plugin not found');
    }
    plugin.config.settings = { ...plugin.config.settings, ...settings };
    await this.deviceConfig.updatePluginState(id, { settings: plugin.config.settings });
    logger.info(`Updated settings for plugin ${id}`);
  }

  async enablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    // Disable all other plugins first
    for (const [id, otherPlugin] of this.plugins) {
      if (id !== pluginId && otherPlugin.config.enabled) {
        otherPlugin.config.enabled = false;
        await this.deviceConfig.updatePluginState(id, { enabled: false });
        const job = this.jobs.get(id);
        if (job) {
          job.stop();
          this.jobs.delete(id);
        }
        logger.info(`Disabled plugin ${id} to enable ${pluginId}`);
      }
    }

    // Now enable the requested plugin
    plugin.config.enabled = true;
    await this.deviceConfig.updatePluginState(pluginId, { enabled: true });
    this.schedulePlugin(plugin);
    logger.info(`Enabled plugin ${pluginId}`);
  }

  async disablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    plugin.config.enabled = false;
    await this.deviceConfig.updatePluginState(pluginId, { enabled: false });
    const job = this.jobs.get(pluginId);
    if (job) {
      job.stop();
      this.jobs.delete(pluginId);
    }
  }

  async cleanup(): Promise<void> {
    for (const [id, plugin] of this.plugins) {
      try {
        await plugin.cleanup();
        const job = this.jobs.get(id);
        if (job) {
          job.stop();
        }
      } catch (error) {
        logger.error(`Error cleaning up plugin ${id}:`, error);
      }
    }
    this.plugins.clear();
    this.jobs.clear();
  }

  getPluginConfigs(): PluginConfig[] {
    return Array.from(this.plugins.values()).map(plugin => plugin.config);
  }

  async getPlugins(): Promise<PluginConfig[]> {
    return this.getPluginConfigs();
  }

  async getPlugin(id: string): Promise<PluginConfig | null> {
    const plugin = this.plugins.get(id);
    return plugin ? plugin.config : null;
  }

  getPluginInstance(id: string): Plugin | null {
    return this.plugins.get(id) || null;
  }
} 