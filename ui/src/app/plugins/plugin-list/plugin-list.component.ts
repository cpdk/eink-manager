import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { PluginConfig } from '../../interfaces/plugin.interface';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-plugin-list',
  templateUrl: './plugin-list.component.html',
  styleUrls: ['./plugin-list.component.css'],
  standalone: false
})
export class PluginListComponent implements OnInit {
  plugins: PluginConfig[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {
    console.log('PluginListComponent initialized');
  }

  async ngOnInit(): Promise<void> {
    console.log('ngOnInit called');
    try {
      console.log('Fetching plugins from API...');
      const response = await this.http.get<PluginConfig[]>('/api/plugins').toPromise();
      console.log('API response:', response);
      this.plugins = response || [];
      this.isLoading = false;
    } catch (error) {
      console.error('Failed to load plugins:', error);
      this.errorMessage = 'Failed to load plugins. Please check if the API server is running.';
      this.isLoading = false;
    }
  }

  openPluginSettings(plugin: PluginConfig): void {
    console.log('Opening plugin settings for:', plugin.id);
    console.log('Current route:', this.router.url);
    this.router.navigate(['/plugins', plugin.id]).then(
      success => {
        console.log('Navigation success:', success);
      },
      error => {
        console.error('Navigation error:', error);
      }
    );
  }
} 
