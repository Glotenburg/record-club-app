const mongoose = require('mongoose');
// We'll no longer use the mongoose-sequence plugin
// const AutoIncrement = require('mongoose-sequence')(mongoose);

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

// Hook to auto-generate clubEntryNumber on save (only if not already set)
albumSchema.pre('save', async function(next) {
  // Only set clubEntryNumber if it's a new album and it doesn't already have one
  if (this.isNew && !this.clubEntryNumber) {
    try {
      // Find the current highest clubEntryNumber
      const highestEntry = await mongoose.model('Album').findOne().sort({ clubEntryNumber: -1 }).select('clubEntryNumber');
      
      // Set new clubEntryNumber to highest+1 or 1 if no albums exist
      this.clubEntryNumber = highestEntry ? (highestEntry.clubEntryNumber + 1) : 1;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Remove the auto-increment plugin
// albumSchema.plugin(AutoIncrement, { inc_field: 'clubEntryNumber' });

// Create and export the Album model
const Album = mongoose.model('Album', albumSchema);

module.exports = Album; 