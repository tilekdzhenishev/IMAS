require('dotenv').config();
const mongoose = require('mongoose');
const Artifact = require('../src/models/Artifact');
const logger = require('../src/config/logger');

const sampleArtifacts = [
  {
    name: 'Ancient Egyptian Vase',
    artifactId: 'ART001',
    description: 'A beautifully preserved vase from the 18th Dynasty, featuring intricate hieroglyphics and scenes from daily life.',
    location: {
      room: 'Egyptian Gallery',
      section: 'Ancient Pottery',
      coordinates: { x: 10, y: 5 },
    },
    sensorConfig: {
      type: 'proximity',
      sensitivity: 70,
      threshold: 50,
    },
    responsePattern: {
      type: 'combined',
      sound: {
        enabled: true,
        file: 'egyptian-ambient.mp3',
        volume: 65,
        duration: 8000,
      },
      light: {
        enabled: true,
        color: '#FFD700',
        pattern: 'pulse',
        intensity: 85,
        duration: 8000,
      },
    },
    metadata: {
      period: '1550-1292 BCE',
      artist: 'Unknown',
      yearCreated: -1400,
      category: 'Pottery',
    },
  },
  {
    name: 'Renaissance Portrait',
    artifactId: 'ART002',
    description: 'Oil painting depicting a noble woman from the Italian Renaissance, attributed to the school of Leonardo da Vinci.',
    location: {
      room: 'Renaissance Hall',
      section: 'Portraits',
      coordinates: { x: 15, y: 8 },
    },
    sensorConfig: {
      type: 'motion',
      sensitivity: 60,
      threshold: 30,
    },
    responsePattern: {
      type: 'combined',
      sound: {
        enabled: true,
        file: 'renaissance-music.mp3',
        volume: 50,
        duration: 12000,
      },
      light: {
        enabled: true,
        color: '#8B4513',
        pattern: 'solid',
        intensity: 75,
        duration: 12000,
      },
    },
    metadata: {
      period: 'Renaissance',
      artist: 'School of da Vinci',
      yearCreated: 1495,
      category: 'Painting',
    },
  },
  {
    name: 'Samurai Armor',
    artifactId: 'ART003',
    description: 'Complete set of traditional Japanese samurai armor from the Edo period, featuring intricate lacquerwork and silk cords.',
    location: {
      room: 'Asian Art Wing',
      section: 'Japanese Collection',
      coordinates: { x: 20, y: 12 },
    },
    sensorConfig: {
      type: 'touch',
      sensitivity: 80,
      threshold: 40,
    },
    responsePattern: {
      type: 'combined',
      sound: {
        enabled: true,
        file: 'japanese-drums.mp3',
        volume: 70,
        duration: 6000,
      },
      light: {
        enabled: true,
        color: '#DC143C',
        pattern: 'blink',
        intensity: 90,
        duration: 6000,
      },
    },
    metadata: {
      period: 'Edo Period',
      artist: 'Master Craftsman Tanaka',
      yearCreated: 1750,
      category: 'Armor',
    },
  },
  {
    name: 'Impressionist Landscape',
    artifactId: 'ART004',
    description: 'A vibrant landscape painting showcasing the impressionist technique, featuring a serene countryside scene.',
    location: {
      room: 'Modern Art Gallery',
      section: 'Impressionism',
      coordinates: { x: 8, y: 15 },
    },
    sensorConfig: {
      type: 'proximity',
      sensitivity: 50,
      threshold: 60,
    },
    responsePattern: {
      type: 'light',
      sound: {
        enabled: false,
      },
      light: {
        enabled: true,
        color: '#87CEEB',
        pattern: 'rainbow',
        intensity: 80,
        duration: 10000,
      },
    },
    metadata: {
      period: 'Impressionism',
      artist: 'Claude Monet',
      yearCreated: 1873,
      category: 'Painting',
    },
  },
  {
    name: 'Pre-Columbian Sculpture',
    artifactId: 'ART005',
    description: 'Stone sculpture from the Mayan civilization, depicting a deity with elaborate headdress and ceremonial attire.',
    location: {
      room: 'Americas Collection',
      section: 'Mesoamerican Art',
      coordinates: { x: 12, y: 10 },
    },
    sensorConfig: {
      type: 'temperature',
      sensitivity: 45,
      threshold: 25,
    },
    responsePattern: {
      type: 'sound',
      sound: {
        enabled: true,
        file: 'mayan-flutes.mp3',
        volume: 60,
        duration: 9000,
      },
      light: {
        enabled: false,
      },
    },
    metadata: {
      period: 'Classic Period',
      artist: 'Unknown Mayan Artisan',
      yearCreated: 600,
      category: 'Sculpture',
    },
  },
];

async function seedDatabase() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/museum-artifacts';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('📦 Connected to MongoDB');
    console.log('🌱 Seeding database with sample artifacts...\n');

    await Artifact.deleteMany({});
    console.log('🗑️  Cleared existing artifacts');

    const created = await Artifact.insertMany(sampleArtifacts);
    
    console.log(`\n✅ Successfully seeded ${created.length} artifacts:`);
    created.forEach(artifact => {
      console.log(`   - ${artifact.artifactId}: ${artifact.name}`);
    });

    console.log('\n📊 Database seeding complete!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
}

seedDatabase();

