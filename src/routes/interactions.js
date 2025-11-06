const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const Interaction = require('../models/Interaction');
const Artifact = require('../models/Artifact');
const { authenticateAPIKey } = require('../middleware/auth');
const logger = require('../config/logger');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

router.post(
  '/',
  authenticateAPIKey,
  [
    body('artifactId').trim().notEmpty().withMessage('Artifact ID is required'),
    body('sensorData.type')
      .isIn(['proximity', 'touch', 'motion', 'temperature', 'custom'])
      .withMessage('Invalid sensor type'),
    body('sensorData.value').isNumeric().withMessage('Sensor value must be a number'),
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { artifactId, sensorData, interactionType, deviceInfo, metadata } = req.body;
      
      const artifact = await Artifact.findOne({ 
        artifactId: artifactId.toUpperCase() 
      });

      if (!artifact) {
        return res.status(404).json({
          success: false,
          error: 'Artifact not found',
        });
      }

      if (!artifact.isActive) {
        return res.status(400).json({
          success: false,
          error: 'Artifact is not active',
        });
      }

      const interaction = new Interaction({
        artifactId: artifact.artifactId,
        artifact: artifact._id,
        sensorData,
        interactionType: interactionType || 'detected',
        deviceInfo,
        metadata,
      });

      await interaction.save();
      await artifact.incrementInteractions();

      logger.info('Interaction recorded', {
        artifactId: artifact.artifactId,
        interactionId: interaction._id,
        sensorType: sensorData.type,
        value: sensorData.value,
      });

      res.status(201).json({
        success: true,
        data: {
          interaction,
          artifact: {
            id: artifact.artifactId,
            name: artifact.name,
            responsePattern: artifact.responsePattern,
          },
        },
        message: 'Interaction recorded successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/', authenticateAPIKey, async (req, res, next) => {
  try {
    const { 
      artifactId, 
      limit = 50, 
      hours = 24,
      processed 
    } = req.query;

    let query = {};
    
    if (artifactId) {
      query.artifactId = artifactId.toUpperCase();
    }
    
    if (processed !== undefined) {
      query.processed = processed === 'true';
    }

    const since = new Date(Date.now() - parseInt(hours) * 60 * 60 * 1000);
    query.createdAt = { $gte: since };

    const interactions = await Interaction.find(query)
      .populate('artifact', 'name location responsePattern')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: interactions.length,
      data: interactions,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticateAPIKey, async (req, res, next) => {
  try {
    const interaction = await Interaction.findById(req.params.id)
      .populate('artifact');

    if (!interaction) {
      return res.status(404).json({
        success: false,
        error: 'Interaction not found',
      });
    }

    res.json({
      success: true,
      data: interaction,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/artifact/:artifactId', authenticateAPIKey, async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;
    
    const interactions = await Interaction.findByArtifactId(
      req.params.artifactId.toUpperCase(),
      parseInt(limit)
    );

    res.json({
      success: true,
      count: interactions.length,
      data: interactions,
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/process', authenticateAPIKey, async (req, res, next) => {
  try {
    const interaction = await Interaction.findByIdAndUpdate(
      req.params.id,
      { processed: true },
      { new: true }
    );

    if (!interaction) {
      return res.status(404).json({
        success: false,
        error: 'Interaction not found',
      });
    }

    res.json({
      success: true,
      data: interaction,
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticateAPIKey, async (req, res, next) => {
  try {
    const interaction = await Interaction.findByIdAndDelete(req.params.id);

    if (!interaction) {
      return res.status(404).json({
        success: false,
        error: 'Interaction not found',
      });
    }

    logger.info('Interaction deleted', { interactionId: req.params.id });

    res.json({
      success: true,
      message: 'Interaction deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
