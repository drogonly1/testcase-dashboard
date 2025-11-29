// src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.API_PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX || 100
});
app.use('/api/', limiter);

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Import controllers
const testCaseController = require('./controllers/testcase.controller');

// Routes
// app.post('/api/testcases/sync', (req, res) => testCaseController.syncTestCases(req, res));
// app.get('/api/dashboard/metrics', (req, res) => testCaseController.getDashboardMetrics(req, res));
// app.get('/api/dashboard/trends', (req, res) => testCaseController.getTrends(req, res));
// app.get('/api/testcases', (req, res) => testCaseController.getTestCases(req, res));
// Test Cases CRUD
app.get('/api/testcases', testCaseController.getAll);
app.get('/api/testcases/:id', testCaseController.getById);
app.post('/api/testcases', testCaseController.create);
app.put('/api/testcases/:id', testCaseController.update);
app.delete('/api/testcases/:id', testCaseController.delete);

// Metrics & Trends
app.get('/api/testcases/metrics', testCaseController.getMetrics);
app.get('/api/testcases/trends', testCaseController.getTrends);

// Sync
app.post('/api/testcases/sync', testCaseController.syncTestCases);

// Settings routes
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await prisma.setting.findFirst();
    if (!settings) {
      return res.json({
        auto_update_enabled: false,
        collection_interval: 30
      });
    }
    res.json({
      auto_update_enabled: settings.autoUpdateEnabled,
      collection_interval: settings.collectionInterval,
      next_collection_at: settings.lastCollectionAt 
        ? new Date(settings.lastCollectionAt.getTime() + settings.collectionInterval * 60000).toISOString()
        : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/settings/auto-update', async (req, res) => {
  try {
    const { enabled, interval, source, file_path, spreadsheet_id, sheet_name } = req.body;
    
    const settings = await prisma.setting.upsert({
      where: { id: 1 },
      create: {
        autoUpdateEnabled: enabled,
        collectionInterval: interval || 30,
        sourceType: source,
        sourcePath: file_path,
        spreadsheetId: spreadsheet_id,
        sheetName: sheet_name
      },
      update: {
        autoUpdateEnabled: enabled,
        collectionInterval: interval || 30,
        sourceType: source,
        sourcePath: file_path,
        spreadsheetId: spreadsheet_id,
        sheetName: sheet_name,
        updatedAt: new Date()
      }
    });
    
    res.json({
      success: true,
      settings: {
        auto_update_enabled: settings.autoUpdateEnabled,
        collection_interval: settings.collectionInterval
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/settings/interval', async (req, res) => {
  try {
    const { interval } = req.body;
    
    const settings = await prisma.setting.update({
      where: { id: 1 },
      data: {
        collectionInterval: interval,
        updatedAt: new Date()
      }
    });
    
    res.json({
      success: true,
      interval: settings.collectionInterval
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/settings/manual-trigger', async (req, res) => {
  try {
    // TODO: Trigger manual collection via queue
    res.json({
      success: true,
      message: 'Manual collection triggered'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Backend API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;
