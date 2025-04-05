import { createCanvas } from 'canvas';
import sharp from 'sharp';
import { Impression73 } from '@aeroniemi/inky';
import { logger } from '../utils/logger';
import * as path from 'path';
import * as fs from 'fs/promises';

export class DisplayService {
  private width: number;
  private height: number;
  private display: Impression73;
  private currentImagePath: string | null = null;
  private readonly tempDir: string;

  constructor() {
    // Default to 7.3" display dimensions
    this.width = 800;
    this.height = 480;
    this.display = new Impression73();
    this.tempDir = path.join(process.cwd(), 'temp');
  }

  async initialize(): Promise<void> {
    try {
      // Create temp directory if it doesn't exist
      await fs.mkdir(this.tempDir, { recursive: true });
      // The display is initialized when creating the Impression73 instance
      console.log('Display initialized successfully');
    } catch (error) {
      console.error('Failed to initialize display:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    // TODO: Implement display clearing
    logger.info('Clearing display');
  }

  async show(): Promise<void> {
    // TODO: Implement display update
    logger.info('Updating display');
  }

  async updateDisplay(imagePath: string): Promise<void> {
    try {
      // Process the image for display (resize only, preserve color)
      const processedImagePath = path.join(this.tempDir, 'current_display.png');
      await sharp(imagePath)
        .resize(800, 480, { fit: 'contain', background: 'white' })
        .toFile(processedImagePath);

      this.currentImagePath = processedImagePath;
      logger.info('Display updated successfully');
    } catch (error) {
      logger.error('Failed to update display:', error);
      throw error;
    }
  }

  async getCurrentImage(): Promise<string> {
    if (!this.currentImagePath) {
      // Return a blank white image if no current image
      const blankImagePath = path.join(this.tempDir, 'blank.png');
      await sharp({
        create: {
          width: 800,
          height: 480,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        }
      })
      .png()
      .toFile(blankImagePath);
      return blankImagePath;
    }
    return this.currentImagePath;
  }

  async clearDisplay(): Promise<void> {
    try {
      const blankImagePath = path.join(this.tempDir, 'blank.png');
      await sharp({
        create: {
          width: 800,
          height: 480,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        }
      })
      .png()
      .toFile(blankImagePath);
      
      this.currentImagePath = blankImagePath;
      logger.info('Display cleared successfully');
    } catch (error) {
      logger.error('Failed to clear display:', error);
      throw error;
    }
  }

  private async prepareImage(imagePath: string): Promise<string> {
    try {
      // Resize and convert image to correct format
      const outputPath = `${imagePath}.processed`;
      await sharp(imagePath)
        .resize(this.width, this.height, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255 }
        })
        .toFile(outputPath);
      
      return outputPath;
    } catch (error) {
      logger.error('Failed to prepare image:', error);
      throw error;
    }
  }

  async drawText(text: string, options: {
    x?: number;
    y?: number;
    fontSize?: number;
    color?: string;
  } = {}): Promise<string> {
    const canvas = createCanvas(this.width, this.height);
    const ctx = canvas.getContext('2d');

    // Set white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, this.width, this.height);

    // Set text properties
    ctx.fillStyle = options.color || 'black';
    ctx.font = `${options.fontSize || 16}px Arial`;
    ctx.textBaseline = 'top';

    // Draw text
    ctx.fillText(text, options.x || 10, options.y || 10);

    // Save the image
    const outputPath = `${process.cwd()}/temp/text_${Date.now()}.png`;
    const buffer = canvas.toBuffer('image/png');
    await sharp(buffer).toFile(outputPath);

    return outputPath;
  }
} 