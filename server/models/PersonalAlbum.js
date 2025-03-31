const mongoose = require('mongoose');

// Define PersonalAlbum Schema
const personalAlbumSchema = new mongoose.Schema({
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
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
  coverArtUrl: { 
    type: String 
  },
  userRating: { 
    type: Number, 
    min: 0, 
    max: 10 
  },
  notes: { 
    type: String 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual populate for personal comments
personalAlbumSchema.virtual('comments', {
  ref: 'PersonalComment', // The model to use
  localField: '_id', // Find comments where PersonalComment.personalAlbum
  foreignField: 'personalAlbum', // is equal to PersonalAlbum._id
  options: { sort: { createdAt: -1 } } // Sort comments newest first by default
});

// Create and export the PersonalAlbum model
const PersonalAlbum = mongoose.model('PersonalAlbum', personalAlbumSchema);

module.exports = PersonalAlbum; 