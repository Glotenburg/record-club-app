const mongoose = require('mongoose');
const PersonalAlbum = require('../models/PersonalAlbum');
const PersonalComment = require('../models/PersonalComment');

// @desc    Test endpoint
// @route   GET /api/personal-albums/test
// @access  Public
const testRoute = (req, res) => {
  res.status(200).json({ message: "Personal albums API is working" });
};

// @desc    Create a new personal album
// @route   POST /api/personal-albums
// @access  Private
const createPersonalAlbum = async (req, res) => {
  console.log('[DEBUG] Entering createPersonalAlbum controller');
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
};

// @desc    Update a personal album
// @route   PUT /api/personal-albums/:albumId
// @access  Private
const updatePersonalAlbum = async (req, res) => {
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
};

// @desc    Delete a personal album
// @route   DELETE /api/personal-albums/:albumId
// @access  Private
const deletePersonalAlbum = async (req, res) => {
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
};

// @desc    Get comments for a personal album
// @route   GET /api/personal-albums/:albumId/comments
// @access  Public
const getPersonalAlbumComments = async (req, res) => {
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
};

// @desc    Add a comment to a personal album
// @route   POST /api/personal-albums/:albumId/comments
// @access  Private
const addPersonalAlbumComment = async (req, res) => {
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
};

module.exports = {
  testRoute,
  createPersonalAlbum,
  updatePersonalAlbum,
  deletePersonalAlbum,
  getPersonalAlbumComments,
  addPersonalAlbumComment
}; 