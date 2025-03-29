const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

// Define Album Schema
const albumSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  artist: {
    type: String,
    required: true
  },
  releaseYear: {
    type: Number
  },
  genre: {
    type: [String] // Array of strings for multiple genres
  },
  coverArtUrl: {
    type: String
  },
  spotifyId: {
    type: String
  },
  trivia: {
    type: String
  },
  clubEntryNumber: {
    type: Number
  },
  clubOriginalScore: { 
    type: Number, 
    min: 0, 
    max: 10 
  }, // Optional, admin-set score
  scores: [{
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    score: { 
      type: Number, 
      min: 0, 
      max: 10, 
      required: true 
    } // Allow decimals 0.0-10.0
  }],
  averageUserScore: { 
    type: Number, 
    default: 0 
  },
  dateAdded: {
    type: Date,
    default: Date.now
  },
  favoritedBy: [{
    type: mongoose.Schema.Types.ObjectId, // Stores User ObjectIds
    ref: 'User' // Creates a reference to the User model
  }]
}, { 
  timestamps: true, 
  toJSON: { virtuals: true }, 
  toObject: { virtuals: true } 
});

// Virtual populate for comments
albumSchema.virtual('comments', {
  ref: 'Comment', // The model to use
  localField: '_id', // Find comments where Comment.albumId
  foreignField: 'albumId', // is equal to Album._id
  options: { sort: { createdAt: -1 } } // Sort comments newest first by default
});

// Apply the auto-increment plugin to manage the clubEntryNumber field
albumSchema.plugin(AutoIncrement, { inc_field: 'clubEntryNumber' });

// Create and export the Album model
const Album = mongoose.model('Album', albumSchema);

module.exports = Album; 