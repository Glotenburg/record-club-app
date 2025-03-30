// Admin route to fix club entry numbers
router.post('/fix-entry-numbers', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin users can perform this action' });
    }

    // Get all albums sorted by existing clubEntryNumber
    const albums = await Album.find().sort({ clubEntryNumber: 1 });
    
    // Sequentially update club entry numbers to remove gaps
    for (let i = 0; i < albums.length; i++) {
      const album = albums[i];
      const newEntryNumber = i + 1; // 1-based indexing
      
      if (album.clubEntryNumber !== newEntryNumber) {
        album.clubEntryNumber = newEntryNumber;
        await album.save();
      }
    }

    // Get the updated albums to return
    const updatedAlbums = await Album.find().sort({ clubEntryNumber: 1 });
    res.json(updatedAlbums);
  } catch (error) {
    console.error('Error fixing club entry numbers:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin route to update album details
router.put('/:id/admin', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin users can perform this action' });
    }

    const { clubEntryNumber, title, artist, releaseYear } = req.body;
    const albumId = req.params.id;

    // Find the album to update
    const album = await Album.findById(albumId);
    if (!album) {
      return res.status(404).json({ message: 'Album not found' });
    }

    // If changing club entry number, check if it already exists
    if (clubEntryNumber && clubEntryNumber !== album.clubEntryNumber) {
      const existingAlbum = await Album.findOne({ clubEntryNumber });
      if (existingAlbum && existingAlbum._id.toString() !== albumId) {
        return res.status(400).json({ 
          message: `Club entry number ${clubEntryNumber} is already assigned to "${existingAlbum.title}" by ${existingAlbum.artist}` 
        });
      }
      album.clubEntryNumber = clubEntryNumber;
    }

    // Update other fields if provided
    if (title) album.title = title;
    if (artist) album.artist = artist;
    if (releaseYear !== undefined) album.releaseYear = releaseYear;

    // Save the updated album
    await album.save();
    res.json(album);
  } catch (error) {
    console.error('Error updating album:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Route to delete an album
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin users can delete albums' });
    }

    const albumId = req.params.id;
    
    // Find the album to delete
    const album = await Album.findById(albumId);
    if (!album) {
      return res.status(404).json({ message: 'Album not found' });
    }
    
    // Optional: Delete all comments associated with the album
    // This depends on your Comment model structure
    const Comment = mongoose.model('Comment');
    await Comment.deleteMany({ albumId });
    
    // Delete the album
    await Album.findByIdAndDelete(albumId);
    
    // Note: We don't automatically reorder club entry numbers here
    // This is handled separately by the fix-entry-numbers endpoint
    
    res.json({ message: 'Album deleted successfully' });
  } catch (error) {
    console.error('Error deleting album:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Route to get all albums (with optional sorting)
router.get('/', async (req, res) => {
  try {
    let sortOption = {};
    
    // Handle sorting parameters from frontend
    if (req.query.sort) {
      switch (req.query.sort) {
        case 'added_asc':
          sortOption = { clubEntryNumber: 1 };
          break;
        case 'added_desc':
          sortOption = { clubEntryNumber: -1 };
          break;
        case 'date_added_asc':
          sortOption = { dateAdded: 1 };
          break;
        case 'date_added_desc':
          sortOption = { dateAdded: -1 };
          break;
        case 'artist_asc':
          sortOption = { artist: 1 };
          break;
        case 'artist_desc':
          sortOption = { artist: -1 };
          break;
        case 'title_asc':
          sortOption = { title: 1 };
          break;
        case 'title_desc':
          sortOption = { title: -1 };
          break;
        default:
          sortOption = { dateAdded: -1 }; // Default sort
      }
    } else {
      // Default sort if no sort parameter is provided
      sortOption = { dateAdded: -1 };
    }

    const albums = await Album.find().sort(sortOption);
    res.json(albums);
  } catch (error) {
    console.error('Error fetching albums:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}); 