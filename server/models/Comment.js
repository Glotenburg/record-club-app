const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  author: {
    type: String, // Temporarily using String, might link to User model later
    required: true,
    default: 'Anonymous',
  },
  threadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Thread',
    required: true,
    index: true,
  },
  // Potential future features: upvotes, replies to comments, etc.
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment; 