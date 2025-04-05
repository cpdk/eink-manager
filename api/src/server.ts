import express from 'express';
import cors from 'cors';
import { DisplayService } from './services/display.service';
import { PluginManager } from './services/plugin-manager.service';
import { ClockPlugin } from './plugins/clock.plugin';
import { WeatherPlugin } from './plugins/weather.plugin';
import { logger } from './utils/logger';
import { DeviceConfig } from './services/device-config.service';
import moment from 'moment-timezone';
import path from 'path';

const app = express();
const port = 3000;

// Initialize services
const displayService = new DisplayService();
const deviceConfig = new DeviceConfig();
const pluginManager = new PluginManager(displayService, deviceConfig);

// Initialize display
displayService.initialize().catch(error => {
  logger.error('Failed to initialize display service:', error);
  process.exit(1);
});

// Register plugins
pluginManager.registerPlugin(new ClockPlugin()).catch(error => {
  logger.error('Failed to register plugins:', error);
  process.exit(1);
});

pluginManager.registerPlugin(new WeatherPlugin()).catch(error => {
  logger.error('Failed to register weather plugin:', error);
  process.exit(1);
});

// CORS configuration
app.use(cors({
  origin: 'http://localhost:4200', // Angular dev server
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware
app.use(express.json());

// Add request logging middleware
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Serve static files from public directory
app.use('/public/plugin/:pluginId/image/:filename', (req, res, next) => {
  // Rewrite the URL to serve from the icons directory
  const filePath = path.join(__dirname, '..', 'public', 'plugins', req.params.pluginId, 'icons', req.params.filename);
  res.sendFile(filePath);
});

app.use('/public', express.static(path.join(__dirname, '..', 'public')));

// Serve the Angular app
app.use(express.static(path.join(__dirname, '../../dist/ui')));

// Plugin image route handler
app.get('/public/plugin/:pluginId/image/:filename', (req, res) => {
  const { pluginId, filename } = req.params;
  const imagePath = path.join(__dirname, '..', 'public', 'plugins', pluginId, 'icons', filename);
  res.sendFile(imagePath);
});

// API routes
app.use('/api', (req, res, next) => {
  logger.info(`API request: ${req.method} ${req.url}`);
  next();
});

// Plugin routes
app.get('/api/plugins', async (req, res) => {
  try {
    const plugins = await pluginManager.getPlugins();
    res.json(plugins);
  } catch (error) {
    logger.error('Error fetching plugins:', error);
    res.status(500).json({ error: 'Failed to fetch plugins' });
  }
});

app.get('/api/plugins/:id', async (req, res) => {
  try {
    const plugin = await pluginManager.getPlugin(req.params.id);
    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }
    res.json(plugin);
  } catch (error) {
    logger.error('Error fetching plugin:', error);
    res.status(500).json({ error: 'Failed to fetch plugin' });
  }
});

app.put('/api/plugins/:id/settings', async (req, res) => {
  try {
    await pluginManager.updatePluginSettings(req.params.id, req.body);
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    logger.error('Error updating plugin settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

app.post('/api/plugins/:id/enable', async (req, res) => {
  try {
    await pluginManager.enablePlugin(req.params.id);
    res.json({ message: 'Plugin enabled successfully' });
  } catch (error) {
    logger.error('Error enabling plugin:', error);
    res.status(500).json({ error: 'Failed to enable plugin' });
  }
});

app.post('/api/plugins/:id/disable', async (req, res) => {
  try {
    await pluginManager.disablePlugin(req.params.id);
    res.json({ message: 'Plugin disabled successfully' });
  } catch (error) {
    logger.error('Error disabling plugin:', error);
    res.status(500).json({ error: 'Failed to disable plugin' });
  }
});

// Display routes
app.get('/api/display/current', async (req, res) => {
  try {
    const currentImage = await displayService.getCurrentImage();
    res.sendFile(currentImage);
  } catch (error) {
    logger.error('Error getting current display:', error);
    res.status(500).json({ error: 'Failed to get current display' });
  }
});

app.post('/api/display/update', async (req, res) => {
  try {
    // Get the currently enabled plugin
    const plugins = await pluginManager.getPlugins();
    const enabledPlugin = plugins.find(p => p.enabled);
    
    if (!enabledPlugin) {
      res.status(400).json({ error: 'No plugin is currently enabled' });
      return;
    }

    // Render and update the display
    const plugin = pluginManager.getPluginInstance(enabledPlugin.id);
    if (!plugin) {
      res.status(400).json({ error: 'Plugin not found' });
      return;
    }

    const imagePath = await plugin.render();
    await displayService.updateDisplay(imagePath);
    res.json({ message: 'Display updated successfully' });
  } catch (error) {
    logger.error('Error updating display:', error);
    res.status(500).json({ error: 'Failed to update display' });
  }
});

app.post('/api/display/clear', async (req, res) => {
  try {
    await displayService.clearDisplay();
    res.json({ message: 'Display cleared successfully' });
  } catch (error) {
    logger.error('Error clearing display:', error);
    res.status(500).json({ error: 'Failed to clear display' });
  }
});

// Routes
app.post('/api/clear', async (req, res) => {
  try {
    await displayService.clear();
    res.json({ message: 'Display cleared successfully' });
  } catch (error) {
    logger.error('Error clearing display:', error);
    res.status(500).json({ error: 'Failed to clear display' });
  }
});

app.post('/api/update', async (req, res) => {
  try {
    await displayService.show();
    res.json({ message: 'Display updated successfully' });
  } catch (error) {
    logger.error('Error updating display:', error);
    res.status(500).json({ error: 'Failed to update display' });
  }
});

// Device Settings Routes
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await deviceConfig.getConfig();
    res.json(settings);
  } catch (error) {
    logger.error('Error fetching device settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.get('/api/timezones', async (req, res) => {
  try {
    const timezones = moment.tz.names();
    res.json(timezones);
  } catch (error) {
    logger.error('Error fetching timezones:', error);
    res.status(500).json({ error: 'Failed to fetch timezones' });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const settings = req.body;
    await deviceConfig.updateConfig(settings);
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    logger.error('Error updating device settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// For all other routes, serve the Angular app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../dist/ui/index.html'));
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Error: ' + err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(port, () => {
  logger.info(`Server running at http://localhost:${port}`);
});

// Cleanup on process exit
process.on('SIGINT', async () => {
  logger.info('Shutting down...');
  await pluginManager.cleanup();
  process.exit(0);
}); 
