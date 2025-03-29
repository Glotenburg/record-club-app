const express = require('express');
const router = express.Router();
const SpotifyWebApi = require('spotify-web-api-node');
require('dotenv').config();

// Initialize Spotify API with credentials from .env
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

// @route   GET /api/spotify/search
// @desc    Search albums on Spotify
// @access  Public
router.get('/search', async (req, res) => {
  const { q } = req.query;

  // Check if query parameter exists
  if (!q) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    // Authenticate with Spotify using Client Credentials flow
    const authData = await spotifyApi.clientCredentialsGrant();
    
    // Set the access token
    spotifyApi.setAccessToken(authData.body['access_token']);
    
    // Search for albums that match the query
    const response = await spotifyApi.searchAlbums(q, { limit: 10 });
    
    // Extract and process album results
    const albums = response.body.albums.items.map(album => {
      // Extract release year from release_date (format: YYYY-MM-DD or YYYY)
      const releaseYear = album.release_date ? album.release_date.split('-')[0] : 'Unknown';
      
      // Always get the largest image (index 0 - 640px) for better quality
      const imageUrl = album.images && album.images.length > 0 
        ? album.images[0]?.url || null
        : null;
      
      // Return simplified album object
      return {
        id: album.id,
        title: album.name,
        artists: album.artists.map(artist => artist.name),
        releaseYear,
        imageUrl,
      };
    });
    
    res.json(albums);
  } catch (error) {
    console.error('Spotify API error:', error);
    res.status(500).json({ error: 'Failed to search Spotify' });
  }
});

module.exports = router; 