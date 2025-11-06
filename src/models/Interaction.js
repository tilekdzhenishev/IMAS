const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['proximity', 'touch', 'motion', 'temperature', 'custom'],
    required: true,
  },
  value: {
    type: Number,
    required: true,
  },
  unit: {
    type: String,
    default: 'raw',
  },
  rawData: {
    type: mongoose.Schema.Types.Mixed,
  },
});

const interactionSchema = new mongoose.Schema({
  artifactId: {
    type: String,
    required: [true, 'Artifact ID is required'],
    uppercase: true,
  },
  artifact: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artifact',
  },
  sensorData: {
    type: sensorDataSchema,
    required: true,
  },
  interactionType: {
    type: String,
    enum: ['detected', 'engaged', 'completed'],
    default: 'detected',
  },
  duration: {
    type: Number,
    default: 0,
  },
  responseTriggered: {
    type: Boolean,
    default: false,
  },
  responseDetails: {
    sound: {
      played: { type: Boolean, default: false },
      file: String,
    },
    light: {
      activated: { type: Boolean, default: false },
      pattern: String,
    },
    triggeredAt: Date,
  },
  deviceInfo: {
    deviceId: String,
    firmwareVersion: String,
    batteryLevel: Number,
    signalStrength: Number,
  },
  metadata: {
    visitorCount: Number,
    weather: String,
    timeOfDay: String,
  },
  processed: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

interactionSchema.index({ artifactId: 1, createdAt: -1 });
interactionSchema.index({ 'artifact': 1 });
interactionSchema.index({ createdAt: -1 });
interactionSchema.index({ processed: 1 });

interactionSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

interactionSchema.statics.findByArtifactId = function(artifactId, limit = 10) {
  return this.find({ artifactId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('artifact', 'name location');
};

interactionSchema.statics.getRecent = function(hours = 24, limit = 50) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  return this.find({ createdAt: { $gte: since } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('artifact', 'name location');
};

const Interaction = mongoose.model('Interaction', interactionSchema);

module.exports = Interaction;

