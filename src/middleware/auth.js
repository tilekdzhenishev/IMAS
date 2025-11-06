const logger = require('../config/logger');

const authenticateAPIKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const validApiKey = process.env.API_KEY || 'museum-artifact-api-key-2024';

  if (!apiKey) {
    logger.warn('API request without API key', { ip: req.ip, path: req.path });
    return res.status(401).json({
      success: false,
      error: 'API key is required. Please include X-API-Key header.'
    });
  }

  if (apiKey !== validApiKey) {
    logger.warn('Invalid API key attempt', { ip: req.ip, path: req.path });
    return res.status(403).json({
      success: false,
      error: 'Invalid API key'
    });
  }

  next();
};

module.exports = { authenticateAPIKey };

