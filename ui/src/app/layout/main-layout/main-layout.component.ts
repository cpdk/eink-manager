import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DisplayService } from '../../services/display.service';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css'],
  standalone: false
})
export class MainLayoutComponent implements OnInit {
  currentDisplayImage: string = '/api/display/current';
  isUpdating: boolean = false;
  deviceName: string = 'InkyPi'; // Default name

  constructor(
    private http: HttpClient,
    private router: Router,
    private displayService: DisplayService,
    private settingsService: SettingsService
  ) {
    console.log('MainLayoutComponent initialized');
  }

  ngOnInit(): void {
    console.log('ngOnInit called');
    this.startDisplayPreviewUpdates();
    this.settingsService.getDeviceSettings().subscribe(settings => {
      if (settings) {
        this.deviceName = settings.name;
      }
    });
  }

  isPluginSettingsRoute(): boolean {
    return this.router.url.startsWith('/plugins/');
  }

  openSettings(): void {
    this.router.navigate(['/settings']);
  }

  private startDisplayPreviewUpdates(): void {
    // Initial update
    this.updateDisplayPreview();
  }

  private updateDisplayPreview(): void {
    this.http.get('/api/display/preview', { responseType: 'blob' })
      .subscribe({
        next: (blob: Blob) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            this.currentDisplayImage = reader.result as string;
          };
          reader.readAsDataURL(blob);
        },
        error: (error: any) => {
          console.error('Failed to update display preview:', error);
        }
      });
  }

  async updateDisplay(): Promise<void> {
    if (this.isUpdating) return;
    
    this.isUpdating = true;
    try {
      await this.http.post('/api/display/update', {}).toPromise();
      // Wait a moment for the image to be generated
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Refresh the display image
      this.refreshDisplayImage();
    } catch (error) {
      console.error('Failed to update display:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  async clearDisplay(): Promise<void> {
    try {
      await this.http.post('/api/display/clear', {}).toPromise();
      // Refresh the display image
      this.refreshDisplayImage();
    } catch (error) {
      console.error('Failed to clear display:', error);
    }
  }

  private refreshDisplayImage(): void {
    this.currentDisplayImage = `/api/display/current?t=${new Date().getTime()}`;
  }
} 