import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { DisplayService } from './services/display.service';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const displayService = new DisplayService();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize display service
displayService.initialize().catch(error => {
  logger.error('Failed to initialize display service:', error);
});

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/display/text', async (req, res) => {
  try {
    const { text, options } = req.body;
    const imagePath = await displayService.drawText(text, options);
    await displayService.updateDisplay(imagePath);
    res.json({ success: true, message: 'Display updated with text' });
  } catch (error) {
    logger.error('Error updating display with text:', error);
    res.status(500).json({ success: false, error: 'Failed to update display' });
  }
});

app.post('/display/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }
    await displayService.updateDisplay(req.file.path);
    res.json({ success: true, message: 'Display updated with image' });
  } catch (error) {
    logger.error('Error updating display with image:', error);
    res.status(500).json({ success: false, error: 'Failed to update display' });
  }
});

// Start server
app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
}); 
