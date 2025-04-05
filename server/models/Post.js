const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Post title is required.'],
    trim: true,
  },
  content: {
    type: String,
    required: [true, 'Post content is required.'],
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Assuming your user model is named 'User'
    required: true,
  },
  // Optional: Add a slug for cleaner URLs
  // slug: {
  //   type: String,
  //   unique: true,
  //   // We might auto-generate this from the title later
  // },
  // Optional: Add an excerpt for list previews
  // excerpt: {
  //   type: String,
  //   // Could be auto-generated or manually entered
  // },
  // Optional: Tags/Categories
  // tags: [String],
}, { timestamps: true }); // Adds createdAt and updatedAt automatically

module.exports = mongoose.model('Post', postSchema); 