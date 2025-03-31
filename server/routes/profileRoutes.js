const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');
const PersonalAlbum = require('../models/PersonalAlbum');
const PersonalComment = require('../models/PersonalComment');
const mongoose = require('mongoose');

// GET /api/profiles/:userId - Fetch public profile data
router.get('/profiles/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    // Check if userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    // Find user and exclude sensitive data
    const user = await User.findById(userId).select('-password -email');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find user's personal albums
    const personalAlbums = await PersonalAlbum.find({ owner: userId });

    res.json({
      user,
      personalAlbums
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/profiles/settings - Update profile settings (authenticated)
router.put('/profiles/settings', protect, async (req, res) => {
  try {
    const { backgroundColor, textColor, accentColor, backgroundImageUrl, layoutStyle } = req.body;
    
    // Find the user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update profile settings
    user.profileSettings = {
      backgroundColor: backgroundColor || user.profileSettings.backgroundColor,
      textColor: textColor || user.profileSettings.textColor,
      accentColor: accentColor || user.profileSettings.accentColor,
      backgroundImageUrl: backgroundImageUrl !== undefined ? backgroundImageUrl : user.profileSettings.backgroundImageUrl,
      layoutStyle: layoutStyle || user.profileSettings.layoutStyle
    };

    await user.save();

    res.json({ message: 'Profile settings updated', profileSettings: user.profileSettings });
  } catch (error) {
    console.error('Error updating profile settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/personal-albums - Create a new personal album (authenticated)
router.post('/personal-albums', protect, async (req, res) => {
  try {
    const { title, artist, releaseYear, coverArtUrl, userRating, notes } = req.body;

    // Validate required fields
    if (!title || !artist) {
      return res.status(400).json({ message: 'Title and artist are required' });
    }

    // Create new personal album
    const newPersonalAlbum = new PersonalAlbum({
      owner: req.user._id,
      title,
      artist,
      releaseYear,
      coverArtUrl,
      userRating,
      notes
    });

    const savedAlbum = await newPersonalAlbum.save();
    res.status(201).json(savedAlbum);
  } catch (error) {
    console.error('Error creating personal album:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/personal-albums/:albumId - Update a personal album (authenticated)
router.put('/personal-albums/:albumId', protect, async (req, res) => {
  try {
    const albumId = req.params.albumId;
    const { title, artist, releaseYear, coverArtUrl, userRating, notes } = req.body;

    // Check if albumId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(albumId)) {
      return res.status(400).json({ message: 'Invalid album ID format' });
    }

    // Find the album
    const album = await PersonalAlbum.findById(albumId);
    if (!album) {
      return res.status(404).json({ message: 'Personal album not found' });
    }

    // Check ownership
    if (album.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this album' });
    }

    // Update album
    album.title = title || album.title;
    album.artist = artist || album.artist;
    album.releaseYear = releaseYear !== undefined ? releaseYear : album.releaseYear;
    album.coverArtUrl = coverArtUrl !== undefined ? coverArtUrl : album.coverArtUrl;
    album.userRating = userRating !== undefined ? userRating : album.userRating;
    album.notes = notes !== undefined ? notes : album.notes;
    album.updatedAt = Date.now();

    const updatedAlbum = await album.save();
    res.json(updatedAlbum);
  } catch (error) {
    console.error('Error updating personal album:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/personal-albums/:albumId - Delete a personal album (authenticated)
router.delete('/personal-albums/:albumId', protect, async (req, res) => {
  try {
    const albumId = req.params.albumId;

    // Check if albumId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(albumId)) {
      return res.status(400).json({ message: 'Invalid album ID format' });
    }

    // Find the album
    const album = await PersonalAlbum.findById(albumId);
    if (!album) {
      return res.status(404).json({ message: 'Personal album not found' });
    }

    // Check ownership
    if (album.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this album' });
    }

    // Delete album
    await PersonalAlbum.findByIdAndDelete(albumId);
    
    // Delete associated comments
    await PersonalComment.deleteMany({ personalAlbum: albumId });

    res.json({ message: 'Personal album and associated comments deleted' });
  } catch (error) {
    console.error('Error deleting personal album:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/personal-albums/:albumId/comments - Fetch comments for a personal album
router.get('/personal-albums/:albumId/comments', async (req, res) => {
  try {
    const albumId = req.params.albumId;

    // Check if albumId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(albumId)) {
      return res.status(400).json({ message: 'Invalid album ID format' });
    }

    // Find the album first to check if it exists
    const album = await PersonalAlbum.findById(albumId);
    if (!album) {
      return res.status(404).json({ message: 'Personal album not found' });
    }

    // Get comments and populate author username
    const comments = await PersonalComment.find({ personalAlbum: albumId })
      .populate('author', 'username')
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/personal-albums/:albumId/comments - Add a comment to a personal album (authenticated)
router.post('/personal-albums/:albumId/comments', protect, async (req, res) => {
  try {
    const albumId = req.params.albumId;
    const { text } = req.body;

    // Check if albumId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(albumId)) {
      return res.status(400).json({ message: 'Invalid album ID format' });
    }

    // Validate required fields
    if (!text) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    // Find the album first to check if it exists
    const album = await PersonalAlbum.findById(albumId);
    if (!album) {
      return res.status(404).json({ message: 'Personal album not found' });
    }

    // Create new comment
    const newComment = new PersonalComment({
      personalAlbum: albumId,
      author: req.user._id,
      text
    });

    const savedComment = await newComment.save();
    
    // Populate author information
    const populatedComment = await PersonalComment.findById(savedComment._id)
      .populate('author', 'username');

    res.status(201).json(populatedComment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 