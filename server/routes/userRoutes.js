const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Album = require('../models/Album');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// @route   GET /api/users
// @desc    Get all registered users with activity counts
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Find all users, excluding sensitive data
    const users = await User.find()
      .select('_id username dateRegistered')
      .sort('-dateRegistered');

    // Get all users' activity (ratings and comments)
    const usersWithActivity = await Promise.all(
      users.map(async (user) => {
        // Count ratings
        const albumsRated = await Album.countDocuments({
          'scores.userId': user._id
        });

        // Count comments - use the Comment model instead of Album model for comments
        const Comment = mongoose.model('Comment');
        const commentsCount = await Comment.countDocuments({
          userId: user._id
        });

        // Count favorites
        const albumsFavorited = await Album.countDocuments({
          favoritedBy: user._id
        });

        // Sum the activities
        const totalContributions = albumsRated + commentsCount + albumsFavorited;

        return {
          _id: user._id,
          username: user.username,
          dateRegistered: user.dateRegistered,
          activity: totalContributions
        };
      })
    );

    // Sort by activity (most active first)
    usersWithActivity.sort((a, b) => b.activity - a.activity);

    res.json(usersWithActivity);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:userId/activity
// @desc    Get user's activity (favorites and ratings) 
// @access  Public
router.get('/:userId/activity', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Check if userId is valid
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    // Find albums the user has favorited (using the 'favoritedBy' array in the Album model)
    const favoriteAlbums = await Album.find({ favoritedBy: userId })
      .select('_id title artist releaseYear coverArtUrl')
      .sort('-dateAdded');
    
    // Find ratings the user has given (using the 'userId' field in scores array)
    const albums = await Album.find({ 'scores.userId': userId })
      .select('_id title artist releaseYear coverArtUrl scores')
      .sort('-dateAdded');
    
    // Extract the user's ratings from each album
    const ratings = albums.map(album => {
      const userRating = album.scores.find(score => 
        score.userId.toString() === userId
      );
      
      return {
        _id: userRating._id,
        score: userRating.score,
        album: {
          _id: album._id,
          title: album.title,
          artist: album.artist,
          releaseYear: album.releaseYear,
          coverArtUrl: album.coverArtUrl
        }
      };
    });
    
    res.json({
      favorites: favoriteAlbums,
      ratings: ratings
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: 'User already exists with that email' });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      dateRegistered: new Date(),
      role: 'user', // Default role
      profileSettings: {
        // Default settings
        backgroundColor: '#1a202c',
        textColor: '#e2e8f0',
        accentColor: '#f6ad55',
        layoutStyle: 'default'
      }
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Save user
    await user.save();

    res.status(201).json({ msg: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST /api/users/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Create JWT token
    const payload = {
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        
        // Return token and user data (without password)
        const userData = {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          dateRegistered: user.dateRegistered,
          profileSettings: user.profileSettings
        };
        
        res.json({ token, user: userData });
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   DELETE /api/users/:userId
// @desc    Delete a user (admin only)
// @access  Private/Admin
router.delete('/:userId', protect, isAdmin, async (req, res) => {
  console.log(`[DELETE USER] Request received to delete user with ID: ${req.params.userId}`);
  try {
    const userId = req.params.userId;
    
    // Check if userId is valid
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log(`[DELETE USER] Invalid user ID format: ${userId}`);
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    // Find user by ID
    const user = await User.findById(userId);
    
    if (!user) {
      console.log(`[DELETE USER] User not found with ID: ${userId}`);
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent admins from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      console.log(`[DELETE USER] Admin attempted to delete their own account: ${userId}`);
      return res.status(400).json({ message: 'Admin cannot delete their own account' });
    }
    
    // Delete the user
    await User.findByIdAndDelete(userId);
    console.log(`[DELETE USER] Successfully deleted user: ${userId}, username: ${user.username}`);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('[DELETE USER] Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 