const mongoose = require('mongoose');

// Define User Schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  profileSettings: {
    backgroundColor: {
      type: String,
      default: '#1a202c' // Dark slate blue - matches Tailwind slate-900
    },
    textColor: {
      type: String,
      default: '#e2e8f0' // Light gray - matches Tailwind slate-200
    },
    accentColor: {
      type: String,
      default: '#f6ad55' // Amber/orange - matches Tailwind amber-400
    },
    backgroundImageUrl: {
      type: String,
      default: null
    },
    layoutStyle: {
      type: String,
      enum: ['default', 'compact', 'wide'],
      default: 'default'
    }
  },
  dateRegistered: {
    type: Date,
    default: Date.now
  }
});

// Create and export the User model
const User = mongoose.model('User', userSchema);

module.exports = User; 