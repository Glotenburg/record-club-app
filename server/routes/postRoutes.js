const express = require('express');
const router = express.Router();
const {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
} = require('../controllers/postController');

// Import authentication middleware
const { protect, admin } = require('../middleware/authMiddleware'); // Assuming admin middleware exists or will be added

// Public routes
router.get('/', getPosts);          // Get all posts
router.get('/:id', getPostById);    // Get single post by ID

// Private routes (require login)
router.post('/', protect, createPost); // Create a new post

// Private routes (require login + author/admin authorization - handled in controller for now)
router.put('/:id', protect, updatePost); // Update a post
router.delete('/:id', protect, deletePost); // Delete a post
// Note: The `protect` middleware ensures the user is logged in.
// Authorization (checking if the user is the author or an admin)
// will be handled within the updatePost and deletePost controller functions.

module.exports = router; 