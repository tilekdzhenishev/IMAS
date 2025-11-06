require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

const connectDB = require('./config/database');
const logger = require('./config/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const artifactRoutes = require('./routes/artifacts');
const interactionRoutes = require('./routes/interactions');
const responseRoutes = require('./routes/responses');
const statsRoutes = require('./routes/stats');

const app = express();

const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Museum Artifact System API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use('/api/artifacts', artifactRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/responses', responseRoutes);
app.use('/api/stats', statsRoutes);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Interactive Museum Artifact System API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      artifacts: '/api/artifacts',
      interactions: '/api/interactions',
      responses: '/api/responses',
      stats: '/api/stats',
    },
    documentation: 'See README.md for API documentation'
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`🚀 Server started on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;

