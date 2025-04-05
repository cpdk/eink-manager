import { Plugin, PluginConfig, PluginSettings } from '../interfaces/plugin.interface';
import { logger } from '../utils/logger';
import * as puppeteer from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs/promises';

export abstract class BasePlugin implements Plugin {
  protected browser: puppeteer.Browser | null = null;
  protected page: puppeteer.Page | null = null;
  protected tempDir: string;

  constructor(public config: PluginConfig) {
    this.tempDir = path.join(process.cwd(), 'temp');
  }

  async initialize(): Promise<void> {
    try {
      // Create temp directory if it doesn't exist
      await fs.mkdir(this.tempDir, { recursive: true });
      
      // Launch browser for rendering
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      this.page = await this.browser.newPage();
      await this.page.setViewport({
        width: 800,  // Match your e-ink display width
        height: 480, // Match your e-ink display height
        deviceScaleFactor: 1
      });
      
      logger.info(`Plugin ${this.config.displayName} initialized successfully`);
    } catch (error) {
      logger.error(`Failed to initialize plugin ${this.config.displayName}:`, error);
      throw error;
    }
  }

  abstract render(): Promise<string>;

  async updateSettings(settings: PluginSettings): Promise<void> {
    this.config.settings = { ...this.config.settings, ...settings };
  }

  async cleanup(): Promise<void> {
    if (this.page) {
      await this.page.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
  }

  protected async renderHtml(html: string): Promise<string> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    try {
      // Set up comprehensive request logging
      this.page.on('request', request => {
        // logger.info(`Resource requested: ${request.url()}`);
      });
      this.page.on('requestfinished', request => {
        // logger.info(`Resource loaded: ${request.url()}`);
      });
      this.page.on('requestfailed', request => {
        logger.warn(`Failed to load resource: ${request.url()} - ${request.failure()?.errorText}`);
      });

      // Set the base URL for resolving relative paths
      const baseUrl = 'http://localhost:3000';
      const htmlWithBase = `
        <html>
          <head>
            <base href="${baseUrl}">
            ${html}
          </head>
        </html>
      `;
      
      await this.page.setContent(htmlWithBase, {
        waitUntil: ['networkidle0', 'load', 'domcontentloaded'],
        timeout: 30000
      });

      // Additional wait to ensure all content is rendered
      await new Promise(resolve => setTimeout(resolve, 1000));

      const imagePath = path.join(this.tempDir, `${this.config.id}_${Date.now()}.png`);
      await this.page.screenshot({
        path: imagePath,
        fullPage: false
      });
      return imagePath;
    } catch (error) {
      logger.error(`Failed to render HTML for plugin ${this.config.displayName}:`, error);
      throw error;
    }
  }
} 
