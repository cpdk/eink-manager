import { BasePlugin } from './base.plugin';
import { PluginConfig, SettingDefinition } from '../interfaces/plugin.interface';
import axios from 'axios';

interface WeatherSettings {
  location: {
    lat: number;
    lon: number;
    displayName: string;
    customName?: string;
  };
  apiKey: string;
  units: 'metric' | 'imperial';
  showHumidity: boolean;
  showWind: boolean;
  showForecast: boolean;
  forecastDays: number;
  fontFamily: string;
  fontSize: number;
  textColor: string;
}

interface WeatherData {
  current: {
    temp: number;
    humidity: number;
    wind_speed: number;
    feels_like: number;
    uvi: number;
    summary: string;
    visibility: number;
    pressure: number;
    sunrise: number;
    sunset: number;
    weather: Array<{
      main: string;
      description: string;
      icon: string;
    }>;
  };
  daily: Array<{
    dt: number;
    temp: {
      min: number;
      max: number;
    };
    weather: Array<{
      main: string;
      description: string;
      icon: string;
    }>;
  }>;
  hourly?: Array<{
    dt: number;
    temp: number;
    pop: number;
  }>;
}

interface GeocodeResponse {
  lat: number;
  lon: number;
  name: string;
  country: string;
}

export class WeatherPlugin extends BasePlugin {
  private weatherData: WeatherData | null = null;
  private coordinates: { lat: number; lon: number } | null = null;
  private errorMessage: string | null = null;

  constructor() {
    const settingsSchema: SettingDefinition[] = [
      {
        key: 'location',
        type: 'location',
        label: 'Location',
        description: 'Select your location on the map',
        validation: { required: true }
      },
      {
        key: 'apiKey',
        type: 'string',
        label: 'OpenWeatherMap API Key',
        description: 'Enter your OpenWeatherMap API key',
        validation: { required: true }
      },
      {
        key: 'units',
        type: 'select',
        label: 'Units',
        description: 'Choose your preferred units',
        options: [
          { value: 'metric', label: 'Metric (°C, m/s)' },
          { value: 'imperial', label: 'Imperial (°F, mph)' }
        ],
        default: 'metric'
      },
      {
        key: 'showHumidity',
        type: 'boolean',
        label: 'Show Humidity',
        description: 'Display humidity information',
        default: true
      },
      {
        key: 'showWind',
        type: 'boolean',
        label: 'Show Wind',
        description: 'Display wind information',
        default: true
      },
      {
        key: 'showForecast',
        type: 'boolean',
        label: 'Show Forecast',
        description: 'Display weather forecast',
        default: true
      },
      {
        key: 'forecastDays',
        type: 'number',
        label: 'Forecast Days',
        description: 'Number of days to show in forecast',
        validation: {
          required: true,
          min: 1,
          max: 7
        },
        default: 3
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
          min: 8,
          max: 72
        },
        default: 16
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
      id: 'weather',
      displayName: 'Weather',
      description: 'Displays current weather and forecast',
      version: '1.0.0',
      enabled: false,
      schedule: '*/30 * * * *', // Every 30 minutes
      icon: 'cloud',
      settings: {
        location: null,
        apiKey: '',
        units: 'metric',
        showHumidity: true,
        showWind: true,
        showForecast: true,
        forecastDays: 3,
        fontFamily: 'Arial',
        fontSize: 16,
        textColor: '#000000'
      },
      settingsSchema
    };
    super(defaultConfig);
  }

  async initialize(): Promise<void> {
    await super.initialize();
    try {
      const settings = this.config.settings as WeatherSettings;
      if (settings.apiKey && settings.location) {
        this.coordinates = {
          lat: settings.location.lat,
          lon: settings.location.lon
        };
        await this.fetchWeatherData();
      } else {
        this.errorMessage = 'Please configure your OpenWeatherMap API key and location in the settings';
      }
    } catch (error) {
      console.warn('Weather plugin initialization warning:', error);
      this.errorMessage = error instanceof Error ? error.message : 'Failed to initialize weather plugin';
    }
  }

  private async updateLocation(): Promise<void> {
    const settings = this.config.settings as WeatherSettings;
    if (!settings.apiKey) {
      throw new Error('Please enter your OpenWeatherMap API key in the settings');
    }
    if (!settings.location) {
      throw new Error('Please select a location');
    }
    this.coordinates = {
      lat: settings.location.lat,
      lon: settings.location.lon
    };
    await this.fetchWeatherData();
  }

  private async fetchWeatherData(): Promise<void> {
    const settings = this.config.settings as WeatherSettings;
    if (!settings.apiKey) {
      throw new Error('Please enter your OpenWeatherMap API key in the settings');
    }

    if (!this.coordinates) {
      await this.updateLocation();
    }

    try {
      const response = await axios.get('https://api.openweathermap.org/data/3.0/onecall', {
        params: {
          lat: this.coordinates!.lat,
          lon: this.coordinates!.lon,
          units: settings.units,
          exclude: 'minutely,alerts',
          appid: settings.apiKey
        }
      });

      const data = response.data;

      console.log(JSON.stringify(data, null, 2));

      this.weatherData = {
        current: {
          temp: data.daily[0].temp.max,
          humidity: data.current.humidity,
          wind_speed: data.current.wind_speed,
          feels_like: data.daily[0].feels_like.day,
          summary: data.daily[0].summary,
          uvi: data.current.uvi,
          visibility: data.current.visibility,
          pressure: data.current.pressure,
          sunrise: data.current.sunrise,
          sunset: data.current.sunset,
          weather: data.current.weather
        },
        daily: data.daily.map((day: any) => ({
          dt: day.dt,
          temp: {
            min: day.temp.min,
            max: day.temp.max
          },
          weather: day.weather
        })),
        hourly: data.hourly?.map((hour: any) => ({
          dt: hour.dt,
          temp: hour.temp,
          pop: hour.pop
        }))
      };

      this.errorMessage = null;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Weather API error:', error.response?.data);
        if (error.response?.status === 401) {
          throw new Error('Invalid OpenWeatherMap API key');
        } else if (error.response?.status === 429) {
          throw new Error('API rate limit exceeded. The free tier of OneCall API 3.0 may not be available - please subscribe to a paid plan or use a different API key.');
        }
        throw new Error(`Weather API error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  async render(): Promise<string> {
    const settings = this.config.settings as WeatherSettings;
    
    if (this.errorMessage) {
      return await this.renderError(this.errorMessage);
    }

    if (!this.weatherData) {
      try {
        await this.fetchWeatherData();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch weather data';
        return await this.renderError(errorMessage);
      }
    }

    const current = this.weatherData!.current;
    const daily = this.weatherData!.daily.slice(0, settings.forecastDays);
    const hourly = this.weatherData!.hourly?.slice(0, 24) || [];
    const currentDate = new Date();

    const templateData = {
      fontFamily: settings.fontFamily,
      fontSize: settings.fontSize,
      textColor: settings.textColor,
      location: settings.location.customName || settings.location.displayName,
      currentDate: currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      lastUpdate: currentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      currentIcon: this.getIconPath(current.weather[0].icon),
      currentTemp: Math.round(current.temp),
      temperatureUnit: settings.units === 'metric' ? '°C' : '°F',
      feelsLike: Math.round(current.feels_like),
      weatherMain: current.weather[0].main,
      locationFontSize: Math.round(settings.fontSize * 2),
      smallFontSize: Math.round(settings.fontSize * 0.8),
      summary: current.summary,
      currentIconSize: settings.fontSize * 4,
      currentTempSize: Math.round(settings.fontSize * 2.5),
      tempUnitSize: Math.round(settings.fontSize * 1.5),
      dataPointIconSize: Math.round(settings.fontSize * 1.5),
      forecastIconSize: Math.round(settings.fontSize * 2),
      chartHeight: Math.round(settings.fontSize * 12),
      dataPoints: [
        {
          label: 'Sunrise',
          measurement: new Date(current.sunrise * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          unit: '',
          icon: this.getIconPath('sunrise')
        },
        {
          label: 'Sunset',
          measurement: new Date(current.sunset * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          unit: '',
          icon: this.getIconPath('sunset')
        },
        {
          label: 'Wind',
          measurement: current.wind_speed,
          unit: settings.units === 'metric' ? 'm/s' : 'mph',
          icon: this.getIconPath('wind')
        },
        {
          label: 'Humidity',
          measurement: current.humidity,
          unit: '%',
          icon: this.getIconPath('humidity')
        },
        {
          label: 'Pressure',
          measurement: current.pressure,
          unit: 'hPa',
          icon: this.getIconPath('pressure')
        },
        {
          label: 'UV Index',
          measurement: current.uvi,
          unit: '',
          icon: this.getIconPath('uvi')
        },
        {
          label: 'Visibility',
          measurement: (current.visibility / 1000).toFixed(1),
          unit: 'km',
          icon: this.getIconPath('visibility')
        }
      ],
      showForecast: settings.showForecast,
      daily: daily.map(day => ({
        weekday: new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
        icon: this.getIconPath(day.weather[0].icon),
        maxTemp: Math.round(day.temp.max),
        minTemp: Math.round(day.temp.min)
      })),
      hourlyData: JSON.stringify(hourly.map(h => ({
        time: new Date(h.dt * 1000).toLocaleTimeString('en-US', { hour: '2-digit', hour12: false }),
        temp: Math.round(h.temp),
        pop: Math.round(h.pop * 100)
      })))
    };

    // Set viewport to actual dimensions
    if (this.page) {
      await this.page.setViewport({
        width: 800,
        height: 480,
        deviceScaleFactor: 1
      });
    }

    const fs = require('fs');
    const path = require('path');
    const handlebars = require('handlebars');

    const templatePath = path.join(__dirname, 'weather', 'render', 'weather.html');
    const template = fs.readFileSync(templatePath, 'utf-8');
    const compiledTemplate = handlebars.compile(template);
    const html = compiledTemplate(templateData);

    return await this.renderHtml(html);
  }

  private async renderError(message: string): Promise<string> {
    const settings = this.config.settings as WeatherSettings;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              margin: 0;
              padding: 1rem;
              font-family: ${settings.fontFamily};
              color: ${settings.textColor};
              background-color: white;
            }
            .error-message {
              color: red;
              text-align: center;
              padding: 1rem;
              font-size: ${settings.fontSize}px;
            }
          </style>
        </head>
        <body>
          <div class="error-message">
            ${message}
          </div>
        </body>
      </html>
    `;
    return await this.renderHtml(html);
  }

  async updateSettings(settings: Partial<WeatherSettings>): Promise<void> {
    const oldSettings = this.config.settings as WeatherSettings;
    await super.updateSettings(settings);
    
    try {
      // If location changed, update coordinates
      if (settings.location && settings.location !== oldSettings.location) {
        await this.updateLocation();
      } else if (settings.apiKey || settings.units) {
        await this.fetchWeatherData();
      }
      this.errorMessage = null;
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Failed to update weather data';
      console.error('Failed to update weather data:', error);
    }
  }

  private getIconPath(iconName: string): string {
    return `/public/plugin/weather/image/${iconName}.png`;
  }
} 