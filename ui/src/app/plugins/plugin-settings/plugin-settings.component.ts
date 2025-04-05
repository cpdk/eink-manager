import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy, ChangeDetectorRef, AfterViewChecked } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { PluginConfig, LocationValue } from '../../interfaces/plugin.interface';
import * as L from 'leaflet';

// Base64 encoded marker icons
const iconBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAApCAYAAADAk4LOAAAFgUlEQVR4Aa1XA5BjWRTN2oW17d3YaZtr2962HUzbDNpjszW24mRt28p47v7zq/bXZtrp/lWnXr337j3nPCe85NcypgSFdugCpW5YoDAMRaIMqRi6aKq5E3YqDQO3qAwjVWrD8Ncq/RBpykd8oZUb/kaJutow8r1aP9II0WmLKLIsJyv1w/kqw9Ch2MYdB++12Onxee/QMwvf4/Dk/Lfp/i4nxTXtOoQ4pW5Aj7wpici1A9erdAN2OH64x8OSP9j3Ft3b7aWkTg/Fm91siTra0f9on5sQr9INejH6CUUUpavjFNq1B+Oadhxmnfa8RfEmN8VNAsQhPqF55xHkMzz3jSmChWU6f7/XZKNH+9+hBLOHYozuKQPxyMPUKkrX/K0uWnfFaJGS1QPRtZsOPtr3NsW0uyh6NNCOkU3Yz+bXbT3I8G3xE5EXLXtCXbbqwCO9zPQYPRTZ5vIDXD7U+w7rFDEoUUf7ibHIR4y6bLVPXrz8JVZEql13trxwue/uDivd3fkWRbS6/IA2bID4uk0UpF1N8qLlbBlXs4Ee7HLTfV1j54APvODnSfOWBqtKVvjgLKzF5YdEk5ewRkGlK0i33Eofffc7HT56jD7/6U+qH3Cx7SBLNntH5YIPvODnyfIXZYRVDPqgHtLs5ABHD3YzLuespb7t79FY34DjMwrVrcTuwlT55YMPvOBnRrJ4VXTdNnYug5ucHLBjEpt30701A3Ts+HEa73u6dT3FNWwflY86eMHPk+Yu+i6pzUpRrW7SNDg5JHR4KapmM5Wv2E8Tfcb1HoqqHMHU+uWDD7zg54mz5/2BSnizi9T1Dg4QQXLToGNCkb6tb1NU+QAlGr1++eADrzhn/u8Q2YZhQVlZ5+CAOtqfbhmaUCS1ezNFVm2imDbPmPng5wmz+gwh+oHDce0eUtQ6OGDIyR0uUhUsoO3vfDmmgOezH0mZN59x7MBi++WDL1g/eEiU3avlidO671bkLfwbw5XV2P8Pzo0ydy4t2/0eu33xYSOMOD8hTf4CrBtGMSoXfPLchX+J0ruSePw3LZeK0juPJbYzrhkH0io7B3k164hiGvawhOKMLkrQLyVpZg8rHFW7E2uHOL888IBPlNZ1FPzstSJM694fWr6RwpvcJK60+0HCILTBzZLFNdtAzJaohze60T8qBzyh5ZuOg5e7uwQppofEmf2++DYvmySqGBuKaicF1blQjhuHdvCIMvp8whTTfZzI7RldpwtSzL+F1+wkdZ2TBOW2gIF88PBTzD/gpeREAMEbxnJcaJHNHrpzji0gQCS6hdkEeYt9DF/2qPcEC8RM28Hwmr3sdNyht00byAut2k3gufWNtgtOEOFGUwcXWNDbdNbpgBGxEvKkOQsxivJx33iow0Vw5S6SVTrpVq11ysA2Rp7gTfPfktc6zhtXBBC+adRLshf6sG2RfHPZ5EAc4sVZ83yCN00Fk/4kggu40ZTvIEm5g24qtU4KjBrx/BTTH8ifVASAG7gKrnWxJDcU7x8X6Ecczhm3o6YicvsLXWfh3Ch1W0k8x0nXF+0fFxgt4phz8QvypiwCCFKMqXCnqXExjq10beH+UUA7+nG6mdG/Pu0f3LgFcGrl2s0kNNjpmoJ9o4B29CMO8dMT4Q5ox8uitF6fqsrJOr8qnwNbRzv6hSnG5wP+64C7h9lp30hKNtKdWjtdkbuPA19nJ7Tz3zR/ibgARbhb4AlhavcBebmTHcFl2fvYEnW0ox9xMxKBS8btJ+KiEbq9zA4RthQXDhPa0T9TEe69gWupwc6uBUphquXgf+/FrIjweHQS4/pduMe5ERUMHUd9xv8ZR98CxkS4F2n3EUrUZ10EYNw7BWm9x1GiPssi3GgiGRDKWRYZfXlON+dfNbM+GgIwYdwAAAAASUVORK5CYII=';
const shadowBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACkAAAApCAQAAAACach9AAACMUlEQVR4Ae3ShY7jQBAE0Aoz/f9/HTMzhg1zrdKUrJbdx+Kd2nD8VNudfsL/Th///dyQN2TH6f3y/BGpC379rV+S+qqetBOxImNQXL8JCAr2V4iMQXHGNJxeCfZXhSRBcQMfvkOWUdtfzlLgAENmZDcmo2TVmt8OSM2eXxBp3DjHSMFutqS7SbmemzBiR+xpKCNUIRkdkkYxhAkyGoBvyQFEJEefwSmmvBfJuJ6aKqKWnAkvGZOaZXTUgFqYULWNSHUckZuR1HIIimUExutRxwzOLROIG4vKmCKQt364mIlhSyzAf1m9lHZHJZrlAOMMztRRiKimp/rpdJDc9Awry5xTZCte7FHtuS8wJgeYGrex28xNTd086Dik7vUMscQOa8y4DoGtCCSkAKlNwpgNtphjrC6MIHUkR6YWxxs6Sc5xqn222mmCRFzIt8lEdKx+ikCtg91qS2WpwVfBelJCiQJwvzixfI9cxZQWgiSJelKnwBElKYtDOb2MFbhmUigbReQBV0Cg4+qMXSxXSyGUn4UbF8l+7qdSGnTC0XLCmahIgUHLhLOhpVCtw4CzYXvLQWQbJNmxoCsOKAxSgBJno75avolkRw8iIAFcsdc02e9iyCd8tHwmeSSoKTowIgvscSGZUOA7PuCN5b2BX9mQM7S0wYhMNU74zgsPBj3HU7wguAfnxxjFQGBE6pwN+GjME9zHY7zGp8wVxMShYX9NXvEWD3HbwJf4giO4CFIQxXScH1/TM+04kkBiAAAAAElFTkSuQmCC';

@Component({
  selector: 'app-plugin-settings',
  templateUrl: './plugin-settings.component.html',
  styleUrls: ['./plugin-settings.component.css'],
  standalone: false
})
export class PluginSettingsComponent implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  
  plugin: PluginConfig | null = null;
  private originalSettings: any;
  private map: L.Map | null = null;
  private marker: L.Marker | null = null;
  private mapInitialized = false;
  private shouldInitializeMap = false;
  private defaultIcon: L.Icon;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    console.log('PluginSettingsComponent initialized');
    // Initialize the default icon
    this.defaultIcon = L.icon({
      iconUrl: iconBase64,
      shadowUrl: shadowBase64,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      console.log('Route params:', params);
      const pluginId = params['id'];
      console.log('Plugin ID from route:', pluginId);
      if (pluginId) {
        this.loadPlugin(pluginId);
      }
    });
  }

  ngAfterViewInit(): void {
    console.log('View initialized');
  }

  ngAfterViewChecked(): void {
    if (this.shouldInitializeMap && !this.mapInitialized && this.mapContainer?.nativeElement) {
      console.log('Map container is now available, initializing map');
      this.initializeMap();
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private async loadPlugin(pluginId: string): Promise<void> {
    try {
      console.log('Loading plugin with ID:', pluginId);
      const response = await this.http.get<PluginConfig>(`/api/plugins/${pluginId}`).toPromise();
      console.log('API response received:', response);
      
      if (response) {
        this.plugin = response;
        this.originalSettings = JSON.parse(JSON.stringify(response.settings));
        
        // Set flag to initialize map if needed
        if (this.plugin.settingsSchema.some(s => s.type === 'location')) {
          console.log('Location setting found, will initialize map when container is ready');
          this.shouldInitializeMap = true;
          this.cdr.detectChanges();
        }
      }
    } catch (error) {
      console.error('Failed to load plugin:', error);
      this.router.navigate(['/']);
    }
  }

  private initializeMap(): void {
    console.log('Initializing map...', this.mapContainer);
    if (!this.mapContainer?.nativeElement || this.mapInitialized) {
      console.log('Map already initialized or container not found');
      return;
    }

    try {
      console.log('Creating new map instance');
      
      // Create the map instance
      this.map = L.map(this.mapContainer.nativeElement, {
        center: [0, 0],
        zoom: 2
      });

      // Add the tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);

      // Add click handler
      this.map.on('click', async (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        await this.updateLocation(lat, lng);
      });

      // If we have existing coordinates, show them
      const locationSetting = this.plugin?.settingsSchema.find(s => s.type === 'location');
      if (locationSetting && this.plugin?.settings[locationSetting.key]) {
        const location = this.plugin.settings[locationSetting.key] as LocationValue;
        console.log('Setting initial location:', location);
        this.updateMarker(location.lat, location.lon);
        this.map.setView([location.lat, location.lon], 13);
      }

      // Mark as initialized
      this.mapInitialized = true;
      console.log('Map initialization complete');

      // Force a resize after a short delay
      setTimeout(() => {
        if (this.map) {
          console.log('Invalidating map size');
          this.map.invalidateSize(true);
        }
      }, 100);
    } catch (error) {
      console.error('Error initializing map:', error);
      this.mapInitialized = false;
    }
  }

  private async updateLocation(lat: number, lon: number): Promise<void> {
    if (!this.plugin) return;

    try {
      console.log('Updating location:', lat, lon);
      const response = await this.http.get<any>(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
      ).toPromise();

      console.log('Location response:', response);
      const locationSetting = this.plugin.settingsSchema.find(s => s.type === 'location');
      if (locationSetting) {
        // Preserve the custom name if it exists
        const currentCustomName = this.plugin.settings[locationSetting.key]?.customName;
        
        this.plugin.settings[locationSetting.key] = {
          lat,
          lon,
          displayName: response.display_name,
          ...(currentCustomName ? { customName: currentCustomName } : {})
        };
        
        this.updateMarker(lat, lon);
        this.onSettingChange();
        this.cdr.detectChanges();
      }
    } catch (error) {
      console.error('Failed to get location name:', error);
    }
  }

  private updateMarker(lat: number, lon: number): void {
    if (!this.map) return;

    console.log('Updating marker:', lat, lon);
    if (this.marker) {
      this.marker.remove();
    }
    this.marker = L.marker([lat, lon], { icon: this.defaultIcon }).addTo(this.map);
  }

  getSettingsKeys(): string[] {
    return this.plugin ? Object.keys(this.plugin.settings) : [];
  }

  isString(value: any): boolean {
    return typeof value === 'string';
  }

  isNumber(value: any): boolean {
    return typeof value === 'number';
  }

  isBoolean(value: any): boolean {
    return typeof value === 'boolean';
  }

  onScheduleChange(): void {
    if (!this.plugin) return;
    this.onSettingChange();
  }

  onSettingChange(): void {
    if (!this.plugin) return;
    this.cdr.detectChanges();
    this.http.put(`/api/plugins/${this.plugin.id}/settings`, this.plugin.settings)
      .subscribe({
        next: () => {
          console.log('Settings updated successfully');
        },
        error: (error) => {
          console.error('Failed to update settings:', error);
        }
      });
  }

  resetSettings(): void {
    if (!this.plugin) return;
    this.plugin.settings = JSON.parse(JSON.stringify(this.originalSettings));
    
    // Update map marker if there's a location setting
    const locationSetting = this.plugin.settingsSchema.find(s => s.type === 'location');
    if (locationSetting && this.plugin.settings[locationSetting.key]) {
      const location = this.plugin.settings[locationSetting.key] as LocationValue;
      this.updateMarker(location.lat, location.lon);
      this.map?.setView([location.lat, location.lon], 13);
    }
  }

  saveSettings(): void {
    if (!this.plugin) return;
    const pluginId = this.plugin.id;
    const settings = this.plugin.settings;
    this.http.put(`/api/plugins/${pluginId}/settings`, settings)
      .subscribe({
        next: () => {
          console.log('Settings saved successfully');
          this.originalSettings = JSON.parse(JSON.stringify(settings));
          // Navigate back to main view instead of reloading the plugin
          this.router.navigate(['/']);
        },
        error: (error) => {
          console.error('Failed to save settings:', error);
        }
      });
  }

  async togglePlugin(): Promise<void> {
    if (!this.plugin) return;
    
    try {
      if (this.plugin.enabled) {
        await this.http.post(`/api/plugins/${this.plugin.id}/disable`, {}).toPromise();
      } else {
        // First disable all other plugins
        const plugins = await this.http.get<PluginConfig[]>('/api/plugins').toPromise();
        if (plugins) {
          for (const plugin of plugins) {
            if (plugin.id !== this.plugin.id && plugin.enabled) {
              await this.http.post(`/api/plugins/${plugin.id}/disable`, {}).toPromise();
            }
          }
        }
        // Then enable this plugin
        await this.http.post(`/api/plugins/${this.plugin.id}/enable`, {}).toPromise();
      }
      
      // Navigate back to the plugin list
      this.router.navigate(['/']);
    } catch (error) {
      console.error('Failed to toggle plugin:', error);
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
} 
