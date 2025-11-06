const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const Interaction = require('../models/Interaction');
const Artifact = require('../models/Artifact');
const { authenticateAPIKey } = require('../middleware/auth');
const logger = require('../config/logger');

router.post(
  '/trigger',
  authenticateAPIKey,
  [
    body('artifactId').trim().notEmpty().withMessage('Artifact ID is required'),
    body('interactionId').optional().trim(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { artifactId, interactionId, customPattern } = req.body;

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

      const responsePattern = customPattern || artifact.responsePattern;

      const responseDetails = {
        sound: {
          played: responsePattern.sound?.enabled || false,
          file: responsePattern.sound?.file,
        },
        light: {
          activated: responsePattern.light?.enabled || false,
          pattern: responsePattern.light?.pattern,
        },
        triggeredAt: new Date(),
      };

      if (interactionId) {
        const interaction = await Interaction.findById(interactionId);
        if (interaction) {
          interaction.responseTriggered = true;
          interaction.responseDetails = responseDetails;
          await interaction.save();
        }
      }

      logger.info('Response triggered', {
        artifactId: artifact.artifactId,
        interactionId,
        sound: responseDetails.sound.played,
        light: responseDetails.light.activated,
      });

      res.json({
        success: true,
        message: 'Response triggered successfully',
        data: {
          artifactId: artifact.artifactId,
          artifactName: artifact.name,
          response: {
            type: responsePattern.type,
            sound: responsePattern.sound?.enabled ? {
              file: responsePattern.sound.file,
              volume: responsePattern.sound.volume,
              duration: responsePattern.sound.duration,
            } : null,
            light: responsePattern.light?.enabled ? {
              color: responsePattern.light.color,
              pattern: responsePattern.light.pattern,
              intensity: responsePattern.light.intensity,
              duration: responsePattern.light.duration,
            } : null,
          },
          triggeredAt: responseDetails.triggeredAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/test/:artifactId', authenticateAPIKey, async (req, res, next) => {
  try {
    const artifact = await Artifact.findOne({ 
      artifactId: req.params.artifactId.toUpperCase() 
    });

    if (!artifact) {
      return res.status(404).json({
        success: false,
        error: 'Artifact not found',
      });
    }

    logger.info('Response test triggered', { artifactId: artifact.artifactId });

    res.json({
      success: true,
      message: 'Test response triggered',
      data: {
        artifactId: artifact.artifactId,
        artifactName: artifact.name,
        testResponse: artifact.responsePattern,
        note: 'This is a test trigger. In production, this would activate the physical lights and sound.',
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/history/:artifactId', authenticateAPIKey, async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;

    const interactions = await Interaction.find({
      artifactId: req.params.artifactId.toUpperCase(),
      responseTriggered: true,
    })
      .sort({ 'responseDetails.triggeredAt': -1 })
      .limit(parseInt(limit))
      .select('responseDetails createdAt sensorData');

    res.json({
      success: true,
      count: interactions.length,
      data: interactions,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
