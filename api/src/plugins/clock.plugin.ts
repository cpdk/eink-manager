import { BasePlugin } from './base.plugin';
import { PluginConfig, SettingDefinition } from '../interfaces/plugin.interface';

interface ClockSettings {
  timeFormat: '12h' | '24h';
  showSeconds: boolean;
  fontFamily: string;
  fontSize: number;
  textColor: string;
}

export class ClockPlugin extends BasePlugin {
  constructor() {
    const settingsSchema: SettingDefinition[] = [
      {
        key: 'timeFormat',
        type: 'select',
        label: 'Time Format',
        description: 'Choose 12-hour or 24-hour format',
        options: [
          { value: '12h', label: '12-hour' },
          { value: '24h', label: '24-hour' }
        ],
        default: '12h'
      },
      {
        key: 'showSeconds',
        type: 'boolean',
        label: 'Show Seconds',
        description: 'Display seconds in the time',
        default: true
      },
      {
        key: 'fontFamily',
        type: 'select',
        label: 'Font Family',
        options: [
          { value: 'Arial', label: 'Arial' },
          { value: 'Helvetica', label: 'Helvetica' },
          { value: 'sans-serif', label: 'Sans Serif' }
        ],
        default: 'Arial'
      },
      {
        key: 'fontSize',
        type: 'number',
        label: 'Font Size',
        description: 'Size of the text in pixels',
        validation: {
          required: true,
          min: 12,
          max: 96
        },
        default: 48
      },
      {
        key: 'textColor',
        type: 'string',
        label: 'Text Color',
        description: 'Color in hex format (e.g., #000000)',
        validation: {
          pattern: '^#[0-9A-Fa-f]{6}$'
        },
        default: '#000000'
      }
    ];

    const defaultConfig: PluginConfig = {
      id: 'clock',
      displayName: 'Clock',
      description: 'Displays current time',
      version: '1.0.0',
      enabled: false,
      schedule: '* * * * *', // Every minute
      icon: 'clock',
      settings: {
        timeFormat: '12h',
        showSeconds: true,
        fontFamily: 'Arial',
        fontSize: 48,
        textColor: '#000000'
      },
      settingsSchema
    };
    super(defaultConfig);
  }

  async render(): Promise<string> {
    const settings = this.config.settings as ClockSettings;
    const now = new Date();
    let timeString = '';

    if (settings.timeFormat === '12h') {
      const hours = now.getHours() % 12 || 12;
      const minutes = now.getMinutes().toString().padStart(2, '0');
      timeString = `${hours}:${minutes}`;
      if (settings.showSeconds) {
        const seconds = now.getSeconds().toString().padStart(2, '0');
        timeString += `:${seconds}`;
      }
      timeString += ` ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
    } else {
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      timeString = `${hours}:${minutes}`;
      if (settings.showSeconds) {
        const seconds = now.getSeconds().toString().padStart(2, '0');
        timeString += `:${seconds}`;
      }
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              background-color: white;
              font-family: ${settings.fontFamily};
            }
            .clock {
              font-size: ${settings.fontSize}px;
              color: ${settings.textColor};
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="clock">${timeString}</div>
        </body>
      </html>
    `;

    return this.renderHtml(html);
  }
} 