import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

export interface DeviceSettings {
  name: string;
  orientation: 'horizontal' | 'vertical';
  timezone: string;
  plugin_cycle_interval_seconds: number;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private deviceSettings = new BehaviorSubject<DeviceSettings | null>(null);

  constructor(private http: HttpClient) {
    this.loadSettings();
  }

  private async loadSettings(): Promise<void> {
    try {
      const settings = await this.http.get<DeviceSettings>('/api/settings').toPromise();
      if (settings) {
        this.deviceSettings.next(settings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  getDeviceSettings(): Observable<DeviceSettings | null> {
    return this.deviceSettings.asObservable();
  }

  async updateSettings(settings: Partial<DeviceSettings>): Promise<void> {
    try {
      await this.http.post('/api/settings', settings).toPromise();
      await this.loadSettings(); // Reload settings after update
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  }
} 