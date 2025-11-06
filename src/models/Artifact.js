const mongoose = require('mongoose');

const responsePatternSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['sound', 'light', 'combined'],
    required: true,
  },
  sound: {
    enabled: { type: Boolean, default: false },
    file: { type: String },
    volume: { type: Number, min: 0, max: 100, default: 70 },
    duration: { type: Number, default: 5000 },
  },
  light: {
    enabled: { type: Boolean, default: false },
    color: { type: String, default: '#FFFFFF' },
    pattern: { 
      type: String, 
      enum: ['solid', 'blink', 'pulse', 'rainbow'],
      default: 'solid' 
    },
    intensity: { type: Number, min: 0, max: 100, default: 80 },
    duration: { type: Number, default: 5000 },
  },
});

const artifactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Artifact name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  artifactId: {
    type: String,
    required: [true, 'Artifact ID is required'],
    unique: true,
    trim: true,
    uppercase: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  location: {
    room: { type: String, required: true },
    section: { type: String },
    coordinates: {
      x: Number,
      y: Number,
    },
  },
  sensorConfig: {
    type: {
      type: String,
      enum: ['proximity', 'touch', 'motion', 'temperature', 'custom'],
      required: true,
    },
    sensitivity: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },
    threshold: {
      type: Number,
      default: 100,
    },
  },
  responsePattern: {
    type: responsePatternSchema,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  metadata: {
    period: String,
    artist: String,
    yearCreated: Number,
    category: String,
  },
  statistics: {
    totalInteractions: { type: Number, default: 0 },
    lastInteraction: Date,
  },
}, {
  timestamps: true,
});

artifactSchema.index({ artifactId: 1 });
artifactSchema.index({ isActive: 1 });
artifactSchema.index({ 'location.room': 1 });

artifactSchema.methods.incrementInteractions = function() {
  this.statistics.totalInteractions += 1;
  this.statistics.lastInteraction = new Date();
  return this.save();
};

const Artifact = mongoose.model('Artifact', artifactSchema);

module.exports = Artifact;

