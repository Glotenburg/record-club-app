const mongoose = require('mongoose');

// Define PersonalComment Schema
const personalCommentSchema = new mongoose.Schema({
  personalAlbum: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'PersonalAlbum', 
    required: true, 
    index: true 
  },
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  text: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

// Create and export the PersonalComment model
const PersonalComment = mongoose.model('PersonalComment', personalCommentSchema);

module.exports = PersonalComment; 