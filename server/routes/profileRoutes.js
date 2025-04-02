const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');
const PersonalAlbum = require('../models/PersonalAlbum');
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

module.exports = router; 