const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  testRoute,
  createPersonalAlbum,
  updatePersonalAlbum,
  deletePersonalAlbum,
  getPersonalAlbumComments,
  addPersonalAlbumComment
} = require('../controllers/personalAlbumController');

// @route   /api/personal-albums/test
router.get('/test', testRoute);

// @route   /api/personal-albums
router.route('/')
  .post(protect, createPersonalAlbum);

// @route   /api/personal-albums/:albumId
router.route('/:albumId')
  .put(protect, updatePersonalAlbum)
  .delete(protect, deletePersonalAlbum);

// @route   /api/personal-albums/:albumId/comments
router.route('/:albumId/comments')
  .get(getPersonalAlbumComments)
  .post(protect, addPersonalAlbumComment);

module.exports = router; 