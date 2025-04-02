const mongoose = require('mongoose');

const threadSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
  },
  author: {
    type: String, // Temporarily using String, might link to User model later
    required: true,
    default: 'Anonymous', // Default author if not provided
  },
  albumId: {
    type: String, // Optional: Link to a specific album (e.g., using Spotify ID or DB ID)
    index: true, // Index for faster querying by album
  },
  // We'll store comment IDs here to link them
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
}, {
  timestamps: true // Adds createdAt and updatedAt fields automatically
});

const Thread = mongoose.model('Thread', threadSchema);

module.exports = Thread; 