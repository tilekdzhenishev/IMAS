const express = require('express');
const { body, param, validationResult } = require('express-validator');
const router = express.Router();
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

router.get('/', async (req, res, next) => {
  try {
    const { active, room, limit = 50 } = req.query;
    
    const filter = {};
    if (active !== undefined) filter.isActive = active === 'true';
    if (room) filter['location.room'] = room;

    const artifacts = await Artifact.find(filter)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: artifacts.length,
      data: artifacts,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:artifactId', async (req, res, next) => {
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

    res.json({
      success: true,
      data: artifact,
    });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/',
  authenticateAPIKey,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('artifactId').trim().notEmpty().withMessage('Artifact ID is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('location.room').notEmpty().withMessage('Location room is required'),
    body('sensorConfig.type')
      .isIn(['proximity', 'touch', 'motion', 'temperature', 'custom'])
      .withMessage('Invalid sensor type'),
    body('responsePattern.type')
      .isIn(['sound', 'light', 'combined'])
      .withMessage('Invalid response pattern type'),
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const artifact = new Artifact(req.body);
      await artifact.save();

      logger.info('New artifact created', { artifactId: artifact.artifactId });

      res.status(201).json({
        success: true,
        data: artifact,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          error: 'Artifact ID already exists',
        });
      }
      next(error);
    }
  }
);

router.put(
  '/:artifactId',
  authenticateAPIKey,
  async (req, res, next) => {
    try {
      const artifact = await Artifact.findOneAndUpdate(
        { artifactId: req.params.artifactId.toUpperCase() },
        req.body,
        { new: true, runValidators: true }
      );

      if (!artifact) {
        return res.status(404).json({
          success: false,
          error: 'Artifact not found',
        });
      }

      logger.info('Artifact updated', { artifactId: artifact.artifactId });

      res.json({
        success: true,
        data: artifact,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/:artifactId',
  authenticateAPIKey,
  async (req, res, next) => {
    try {
      const artifact = await Artifact.findOneAndDelete({ 
        artifactId: req.params.artifactId.toUpperCase() 
      });

      if (!artifact) {
        return res.status(404).json({
          success: false,
          error: 'Artifact not found',
        });
      }

      logger.info('Artifact deleted', { artifactId: artifact.artifactId });

      res.json({
        success: true,
        message: 'Artifact deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  '/:artifactId/toggle',
  authenticateAPIKey,
  async (req, res, next) => {
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

      artifact.isActive = !artifact.isActive;
      await artifact.save();

      logger.info('Artifact status toggled', { 
        artifactId: artifact.artifactId,
        isActive: artifact.isActive 
      });

      res.json({
        success: true,
        data: artifact,
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;

