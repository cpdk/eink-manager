import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { PluginSettingsComponent } from './plugins/plugin-settings/plugin-settings.component';
import { PluginListComponent } from './plugins/plugin-list/plugin-list.component';
import { DeviceSettingsComponent } from './settings/device-settings.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent
  },
  {
    path: 'plugins/:id',
    component: PluginSettingsComponent
  },
  {
    path: 'settings',
    component: DeviceSettingsComponent
  }
]; 