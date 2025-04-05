const Post = require('../models/Post');
const User = require('../models/User'); // Assuming your user model is named 'User'
const mongoose = require('mongoose');

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.user.id; // Get user ID from authenticated user (attached by protect middleware)

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    // No need to validate userId here as it comes from a verified token
    // No need to check if author exists, as they are the logged-in user

    const post = new Post({
      title,
      content,
      author: userId,
    });

    const createdPost = await post.save();
    // Populate author info before sending response
    // Use req.user which is already populated (excluding password) by protect middleware
    // Create a simple author object to send back, avoiding potential sensitive info
    const responsePost = createdPost.toObject(); // Convert to plain object to modify
    responsePost.author = {
        _id: req.user._id,
        username: req.user.username,
        email: req.user.email // Or whatever fields you want to expose
    };

    res.status(201).json(responsePost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Server error creating post', error: error.message });
  }
};

// @desc    Get all posts
// @route   GET /api/posts
// @access  Public
const getPosts = async (req, res) => {
  try {
    // Populate author details, sort by newest first
    const posts = await Post.find({})
                           .populate('author', 'username email') // Select fields to return
                           .sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Server error fetching posts', error: error.message });
  }
};

// @desc    Get single post by ID
// @route   GET /api/posts/:id
// @access  Public
const getPostById = async (req, res) => {
  try {
    const postId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: 'Invalid post ID format' });
    }

    const post = await Post.findById(postId).populate('author', 'username email');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.status(200).json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ message: 'Server error fetching post', error: error.message });
  }
};

// @desc    Update a post
// @route   PUT /api/posts/:id
// @access  Private (Author or Admin)
const updatePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { title, content } = req.body;
    const userId = req.user.id; // Get user ID from authenticated user
    const userRole = req.user.role; // Get user role

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: 'Invalid post ID format' });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Authorization check: Allow if user is the author OR if the user is an admin
    if (post.author.toString() !== userId && userRole !== 'admin') {
        return res.status(403).json({ message: 'User not authorized to update this post' });
    }

    post.title = title || post.title;
    post.content = content || post.content;

    const updatedPost = await post.save();
    // Populate author details
    await updatedPost.populate('author', 'username email');

    res.status(200).json(updatedPost);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Server error updating post', error: error.message });
  }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private (Author or Admin)
const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id; // Get user ID from authenticated user
    const userRole = req.user.role; // Get user role

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: 'Invalid post ID format' });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Authorization check: Allow if user is the author OR if the user is an admin
    if (post.author.toString() !== userId && userRole !== 'admin') {
        return res.status(403).json({ message: 'User not authorized to delete this post' });
    }

    await post.deleteOne(); // Use deleteOne() on the instance

    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Server error deleting post', error: error.message });
  }
};

module.exports = {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
}; 