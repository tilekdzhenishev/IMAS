const express = require('express');
const router = express.Router();
const Interaction = require('../models/Interaction');
const Artifact = require('../models/Artifact');
const { authenticateAPIKey } = require('../middleware/auth');

router.get('/overview', authenticateAPIKey, async (req, res, next) => {
  try {
    const { hours = 24 } = req.query;
    const since = new Date(Date.now() - parseInt(hours) * 60 * 60 * 1000);

    const totalArtifacts = await Artifact.countDocuments();
    const activeArtifacts = await Artifact.countDocuments({ isActive: true });
    const totalInteractions = await Interaction.countDocuments();
    const recentInteractions = await Interaction.countDocuments({
      createdAt: { $gte: since },
    });

    const popularArtifacts = await Interaction.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$artifactId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const interactionsByType = await Interaction.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$sensorData.type', count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        artifacts: {
          total: totalArtifacts,
          active: activeArtifacts,
          inactive: totalArtifacts - activeArtifacts,
        },
        interactions: {
          total: totalInteractions,
          recent: recentInteractions,
          timeRange: `Last ${hours} hours`,
        },
        popularArtifacts,
        interactionsByType,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/artifact/:artifactId', authenticateAPIKey, async (req, res, next) => {
  try {
    const { hours = 24 } = req.query;
    const since = new Date(Date.now() - parseInt(hours) * 60 * 60 * 1000);

    const artifact = await Artifact.findOne({ 
      artifactId: req.params.artifactId.toUpperCase() 
    });

    if (!artifact) {
      return res.status(404).json({
        success: false,
        error: 'Artifact not found',
      });
    }

    const recentInteractions = await Interaction.countDocuments({
      artifactId: artifact.artifactId,
      createdAt: { $gte: since },
    });

    const responsesTriggered = await Interaction.countDocuments({
      artifactId: artifact.artifactId,
      responseTriggered: true,
      createdAt: { $gte: since },
    });

    const avgSensorValue = await Interaction.aggregate([
      { 
        $match: { 
          artifactId: artifact.artifactId,
          createdAt: { $gte: since } 
        } 
      },
      { 
        $group: { 
          _id: null, 
          avgValue: { $avg: '$sensorData.value' } 
        } 
      },
    ]);

    const interactionsByHour = await Interaction.aggregate([
      { 
        $match: { 
          artifactId: artifact.artifactId,
          createdAt: { $gte: since } 
        } 
      },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        artifact: {
          id: artifact.artifactId,
          name: artifact.name,
          isActive: artifact.isActive,
          totalInteractions: artifact.statistics.totalInteractions,
          lastInteraction: artifact.statistics.lastInteraction,
        },
        recentStats: {
          interactions: recentInteractions,
          responsesTriggered,
          averageSensorValue: avgSensorValue[0]?.avgValue || 0,
          timeRange: `Last ${hours} hours`,
        },
        interactionsByHour,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/hourly', authenticateAPIKey, async (req, res, next) => {
  try {
    const { hours = 24 } = req.query;
    const since = new Date(Date.now() - parseInt(hours) * 60 * 60 * 1000);

    const hourlyStats = await Interaction.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
            hour: { $hour: '$createdAt' },
          },
          count: { $sum: 1 },
          uniqueArtifacts: { $addToSet: '$artifactId' },
        },
      },
      {
        $project: {
          _id: 0,
          timestamp: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day',
              hour: '$_id.hour',
            },
          },
          count: 1,
          uniqueArtifacts: { $size: '$uniqueArtifacts' },
        },
      },
      { $sort: { timestamp: 1 } },
    ]);

    res.json({
      success: true,
      data: hourlyStats,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
