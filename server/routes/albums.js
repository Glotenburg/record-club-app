const express = require('express');
const router = express.Router();
const Album = require('../models/Album');
const Comment = require('../models/Comment');
const { protect, isAdmin } = require('../middleware/authMiddleware');
const SpotifyWebApi = require('spotify-web-api-node');

// Initialize Spotify API (we'll authenticate later when needed)
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

// Helper function to get high-res image from Spotify
async function getHighResImage(spotifyId) {
  try {
    // Authenticate with Spotify
    const authData = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(authData.body['access_token']);
    
    // Get album details
    const albumData = await spotifyApi.getAlbum(spotifyId);
    
    // Return the largest image URL if available
    if (albumData.body.images && albumData.body.images.length > 0) {
      return albumData.body.images[0].url;
    }
    return null;
  } catch (error) {
    console.error('Error fetching high-res image:', error);
    return null;
  }
}

// @route   GET /api/albums
// @desc    Get all albums with optional sorting
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Get the sort option from query parameters
    const sortOption = req.query.sort;
    
    // Default sort: oldest entry first by clubEntryNumber
    let sortObject = { clubEntryNumber: 1 };
    
    // Change the sort object based on the sortOption value
    switch (sortOption) {
      case 'artist_asc':
        sortObject = { artist: 1 }; // 1 for ascending
        break;
      case 'artist_desc':
        sortObject = { artist: -1 }; // -1 for descending
        break;
      case 'title_asc':
        sortObject = { title: 1 };
        break;
      case 'title_desc':
        sortObject = { title: -1 };
        break;
      case 'year_asc':
        sortObject = { releaseYear: 1 };
        break;
      case 'year_desc':
        sortObject = { releaseYear: -1 };
        break;
      case 'added_asc': // Explicitly sort by entry number ascending
        sortObject = { clubEntryNumber: 1 };
        break;
      case 'added_desc': // Sort by entry number descending (newest entry first)
        sortObject = { clubEntryNumber: -1 };
        break;
      case 'date_added_desc': // Sort by actual date added (most recent first)
        sortObject = { dateAdded: -1 };
        break;
      case 'date_added_asc': // Sort by actual date added (oldest first)
        sortObject = { dateAdded: 1 };
        break;
      // Default case is already set above (clubEntryNumber ascending)
    }
    
    // Fetch all albums with the specified sort
    const albums = await Album.find()
                             .sort(sortObject)
                             .populate('scores.userId', 'username')
                             .populate({
                               path: 'comments',
                               populate: { path: 'userId', select: 'username' } // Populate username within comments
                             });
    res.json(albums);
  } catch (err) {
    console.error('Error fetching albums:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/albums
// @desc    Add a new album
// @access  Private/Admin
router.post('/', protect, isAdmin, async (req, res) => {
  try {
    // Create a new album using the data from the request body
    const newAlbum = new Album(req.body);
    
    // If the album has a spotifyId but low resolution image, we might want to fetch better image
    if (newAlbum.spotifyId && 
        (!newAlbum.coverArtUrl || newAlbum.coverArtUrl.includes('i.scdn.co/image') && newAlbum.coverArtUrl.includes('60'))) {
      try {
        // Authenticate with Spotify using Client Credentials flow
        const authData = await spotifyApi.clientCredentialsGrant();
        spotifyApi.setAccessToken(authData.body['access_token']);
        
        // Get album details directly (which will include full quality images)
        const albumData = await spotifyApi.getAlbum(newAlbum.spotifyId);
        
        // Update cover art with the largest image if available
        if (albumData.body.images && albumData.body.images.length > 0) {
          newAlbum.coverArtUrl = albumData.body.images[0].url;
        }
      } catch (spotifyError) {
        console.error('Error fetching better image from Spotify:', spotifyError);
        // Continue with original image if Spotify fetch fails
      }
    }
    
    // Save the album to the database
    const savedAlbum = await newAlbum.save();
    
    // Return the saved album with 201 Created status
    res.status(201).json(savedAlbum);
  } catch (err) {
    console.error('Error adding album:', err.message);
    
    // Check if this is a validation error
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/albums/:albumId/favorite
// @desc    Favorite an album
// @access  Private
router.post('/:albumId/favorite', protect, async (req, res) => {
  try {
    const album = await Album.findById(req.params.albumId);
    const userId = req.user.id; // Get user ID from protect middleware

    if (!album) {
      return res.status(404).json({ msg: 'Album not found' });
    }

    // Check if already favorited by this user
    if (!album.favoritedBy.includes(userId)) {
      album.favoritedBy.push(userId);
      await album.save();
    }
    // Return the updated album (or just the favoritedBy array)
    res.json(album); // Sending whole album back for simplicity

  } catch (err) {
    console.error(err.message);
    // Handle potential CastError if albumId is invalid format
    if (err.kind === 'ObjectId') {
         return res.status(404).json({ msg: 'Album not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/albums/:albumId/favorite
// @desc    Unfavorite an album
// @access  Private
router.delete('/:albumId/favorite', protect, async (req, res) => {
  try {
    const album = await Album.findById(req.params.albumId);
    const userId = req.user.id; // Get user ID from protect middleware

    if (!album) {
      return res.status(404).json({ msg: 'Album not found' });
    }

    // Remove the user's ID using pull (efficient way)
    album.favoritedBy.pull(userId);
    await album.save();

    // Return the updated album
    res.json(album);

  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
         return res.status(404).json({ msg: 'Album not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/albums/:albumId/score
// @desc    Submit or update a user's score for an album
// @access  Private
router.post('/:albumId/score', protect, async (req, res) => {
  const { score } = req.body;
  const userId = req.user.id;
  const albumId = req.params.albumId;

  // Validate score input
  if (score === undefined || score === null || score < 0 || score > 10) {
    return res.status(400).json({ msg: 'Score must be between 0.0 and 10.0' });
  }
  // Convert score to number just in case it comes as string
  const numericScore = parseFloat(score);
  if (isNaN(numericScore)) {
      return res.status(400).json({ msg: 'Invalid score format' });
  }

  try {
    const album = await Album.findById(albumId);
    if (!album) {
      return res.status(404).json({ msg: 'Album not found' });
    }

    // Find if user already scored this album
    const existingScoreIndex = album.scores.findIndex(s => s.userId.equals(userId));

    if (existingScoreIndex > -1) {
      // Update existing score
      album.scores[existingScoreIndex].score = numericScore;
    } else {
      // Add new score
      album.scores.push({ userId: userId, score: numericScore });
    }

    // Recalculate average user score
    const totalScore = album.scores.reduce((acc, curr) => acc + curr.score, 0);
    album.averageUserScore = album.scores.length > 0
      ? parseFloat((totalScore / album.scores.length).toFixed(1)) // Calculate and round to 1 decimal
      : 0;

    await album.save();
    // Populate user info before sending back (optional but good for immediate UI update)
    const updatedAlbum = await Album.findById(album.id).populate('scores.userId', 'username');
    res.json(updatedAlbum);

  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
         return res.status(404).json({ msg: 'Album not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/albums/:albumId/original-score
// @desc    Set the club's original score for an album
// @access  Private (TODO: Should be Admin only)
router.put('/:albumId/original-score', protect, async (req, res) => {
  const { score } = req.body;
  const albumId = req.params.albumId;

  // Validate score input
   if (score === undefined || score === null || score < 0 || score > 10) {
    return res.status(400).json({ msg: 'Score must be between 0.0 and 10.0' });
  }
   const numericScore = parseFloat(score);
   if (isNaN(numericScore)) {
       return res.status(400).json({ msg: 'Invalid score format' });
   }

  try {
    const album = await Album.findById(albumId);
    if (!album) {
      return res.status(404).json({ msg: 'Album not found' });
    }

    album.clubOriginalScore = numericScore;
    await album.save();
    res.json(album);

  } catch (err) {
    console.error(err.message);
     if (err.kind === 'ObjectId') {
         return res.status(404).json({ msg: 'Album not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/albums/:albumId/comments
// @desc    Get all comments for an album
// @access  Public
router.get('/:albumId/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ albumId: req.params.albumId })
                                  .populate('userId', 'username') // Get username from User model
                                  .sort({ createdAt: -1 }); // Newest comments first
    res.json(comments);
  } catch (err) {
    console.error(err.message);
    // Check if it's an invalid ObjectId format for albumId before querying comments
    if (err.kind === 'ObjectId' && err.path === '_id') { // Simple check, might need refinement
         return res.status(404).json({ msg: 'Album not found or invalid ID format' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/albums/:albumId/comments
// @desc    Add a comment to an album
// @access  Private
router.post('/:albumId/comments', protect, async (req, res) => {
  const { text } = req.body;
  const userId = req.user.id; // From protect middleware
  const albumId = req.params.albumId;

  // Basic validation
  if (!text || text.trim() === '') {
    return res.status(400).json({ msg: 'Comment text is required' });
  }

  try {
    // Optional: Check if album exists first (good practice)
    const albumExists = await Album.findById(albumId);
    if (!albumExists) {
      return res.status(404).json({ msg: 'Album not found' });
    }

    // Create new comment
    const newComment = new Comment({
      albumId: albumId,
      userId: userId,
      text: text.trim()
    });

    // Save comment
    await newComment.save();

    // Populate user info for the response
    const populatedComment = await Comment.findById(newComment.id)
                                          .populate('userId', 'username');

    res.status(201).json(populatedComment); // Send back the newly created comment

  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId' && err.path === '_id') {
         return res.status(404).json({ msg: 'Album not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/albums/:id/update-image
// @desc    Update album cover image to high resolution
// @access  Public (could be restricted to admin)
router.put('/:id/update-image', async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    
    if (!album) {
      return res.status(404).json({ message: 'Album not found' });
    }
    
    // Only try to update if album has a Spotify ID
    if (album.spotifyId) {
      const highResImageUrl = await getHighResImage(album.spotifyId);
      
      if (highResImageUrl) {
        album.coverArtUrl = highResImageUrl;
        await album.save();
        return res.json(album);
      }
    }
    
    return res.status(400).json({ message: 'Could not update image or no Spotify ID available' });
  } catch (err) {
    console.error('Error updating album image:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/albums/update-all-images
// @desc    Update all album cover images to high resolution
// @access  Public (could be restricted to admin)
router.put('/update-all-images', async (req, res) => {
  try {
    // Find all albums with Spotify IDs
    const albums = await Album.find({ spotifyId: { $exists: true, $ne: null } });
    
    let updatedCount = 0;
    const results = [];
    
    // Authenticate with Spotify once for the batch
    const authData = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(authData.body['access_token']);
    
    // Process each album
    for (const album of albums) {
      try {
        const albumData = await spotifyApi.getAlbum(album.spotifyId);
        
        if (albumData.body.images && albumData.body.images.length > 0) {
          const highResImageUrl = albumData.body.images[0].url;
          
          // Only update if the image URL is different
          if (highResImageUrl !== album.coverArtUrl) {
            album.coverArtUrl = highResImageUrl;
            await album.save();
            updatedCount++;
            results.push({ id: album._id, title: album.title, updated: true });
          } else {
            results.push({ id: album._id, title: album.title, updated: false, reason: 'No change needed' });
          }
        } else {
          results.push({ id: album._id, title: album.title, updated: false, reason: 'No images found' });
        }
      } catch (albumError) {
        results.push({ id: album._id, title: album.title, updated: false, reason: 'API error' });
      }
    }
    
    res.json({ 
      message: `Updated ${updatedCount} of ${albums.length} albums`,
      results 
    });
  } catch (err) {
    console.error('Error updating all album images:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/albums/:id/clubscore
// @desc    Update an album's club score (admin only)
// @access  Private/Admin
router.put('/:id/clubscore', protect, isAdmin, async (req, res) => {
  try {
    const { clubScore, clubOriginalScore } = req.body;
    const albumId = req.params.id;
    
    // Use either clubScore or clubOriginalScore parameter (for backward compatibility)
    const scoreToUse = clubScore !== undefined ? clubScore : clubOriginalScore;
    
    // Validate club score
    const numericScore = parseFloat(scoreToUse);
    if (isNaN(numericScore) || numericScore < 0 || numericScore > 10) {
      return res.status(400).json({ message: 'Club score must be a number between 0 and 10' });
    }
    
    // Find and update the album
    const updatedAlbum = await Album.findByIdAndUpdate(
      albumId, 
      { clubOriginalScore: numericScore }, 
      { new: true, runValidators: true }
    ).populate('scores.userId', 'username');
    
    // Check if album exists
    if (!updatedAlbum) {
      return res.status(404).json({ message: 'Album not found' });
    }
    
    // Return the updated album
    res.status(200).json(updatedAlbum);
    
  } catch (err) {
    console.error('Error updating club score:', err.message);
    
    // Check if this is a CastError (invalid ID format)
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Album not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/albums/:id
// @desc    Update album details (including trivia)
// @access  Private/Admin
router.put('/:id', protect, isAdmin, async (req, res) => {
  try {
    const albumId = req.params.id;
    const updateData = req.body;
    
    // Prevent overwriting critical fields or adding unwanted fields
    const allowedUpdates = ['title', 'artist', 'releaseYear', 'genre', 'trivia'];
    const updateObject = {};
    
    // Only include allowed fields that are present in the request
    for (const field of allowedUpdates) {
      if (field in updateData) {
        updateObject[field] = updateData[field];
      }
    }
    
    // Find and update the album
    const updatedAlbum = await Album.findByIdAndUpdate(
      albumId, 
      updateObject, 
      { new: true, runValidators: true }
    ).populate('scores.userId', 'username');
    
    // Check if album exists
    if (!updatedAlbum) {
      return res.status(404).json({ message: 'Album not found' });
    }
    
    // Return the updated album
    res.status(200).json(updatedAlbum);
    
  } catch (err) {
    console.error('Error updating album details:', err.message);
    
    // Check if this is a CastError (invalid ID format)
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Album not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/albums/:id
// @desc    Delete an album
// @access  Private/Admin
router.delete('/:id', protect, isAdmin, async (req, res) => {
  try {
    const albumId = req.params.id;

    // Find the album to be deleted
    const album = await Album.findById(albumId);

    if (!album) {
      return res.status(404).json({ message: 'Album not found' });
    }

    // Delete the album
    await Album.findByIdAndDelete(albumId);

    // Also delete associated comments
    await Comment.deleteMany({ albumId: albumId });

    // Optionally: Could also remove scores/favorites associated if needed, 
    // but deleting the album itself might be sufficient depending on requirements.

    res.status(200).json({ message: 'Album and associated comments deleted successfully' });

  } catch (err) {
    console.error('Error deleting album:', err.message);

    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Album not found' });
    }

    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 