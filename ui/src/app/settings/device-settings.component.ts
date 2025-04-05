import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

interface DeviceSettings {
  name: string;
  orientation: 'horizontal' | 'vertical';
  timezone: string;
  plugin_cycle_interval_seconds: number;
}

@Component({
  selector: 'app-device-settings',
  templateUrl: './device-settings.component.html',
  styleUrls: ['./device-settings.component.css'],
  standalone: false
})
export class DeviceSettingsComponent implements OnInit {
  settings: DeviceSettings | null = null;
  timezones: string[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      const [settingsResponse, timezonesResponse] = await Promise.all([
        this.http.get<DeviceSettings>('/api/settings').toPromise(),
        this.http.get<string[]>('/api/timezones').toPromise()
      ]);

      if (settingsResponse) {
        this.settings = settingsResponse;
      }
      if (timezonesResponse) {
        this.timezones = timezonesResponse;
      }
      this.isLoading = false;
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.errorMessage = 'Failed to load settings. Please try again.';
      this.isLoading = false;
    }
  }

  async saveSettings(): Promise<void> {
    if (!this.settings) return;

    try {
      await this.http.post('/api/settings', this.settings).toPromise();
      console.log('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.errorMessage = 'Failed to save settings. Please try again.';
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
} 