const express = require('express');
const router = express.Router();
const Thread = require('../models/Thread');
const Comment = require('../models/Comment');

// --- Thread Routes ---

// GET /api/discussions - Fetch all threads (sorted by newest)
router.get('/', async (req, res) => {
  try {
    // Fetch threads, sort by createdAt descending. Populate comment details.
    const threads = await Thread.find()
                              .sort({ createdAt: -1 })
                              .populate('comments'); // Consider fetching only comment count for list view efficiency later
    res.json(threads);
  } catch (error) {
    console.error('Error fetching threads:', error);
    res.status(500).json({ message: 'Server error while fetching threads' });
  }
});

// POST /api/discussions - Create a new thread
router.post('/', async (req, res) => {
  try {
    const { title, content, author, albumId } = req.body;
    // Basic validation (could be more robust)
    if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required' });
    }
    const newThread = new Thread({
      title,
      content,
      author, // Assuming author info (like username or ID) comes from authenticated request later
      albumId // Optional
    });
    const savedThread = await newThread.save();
    res.status(201).json(savedThread);
  } catch (error) {
    console.error('Error creating thread:', error);
    // Handle potential validation errors from Mongoose
    if (error.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation failed', errors: error.errors });
    }
    res.status(500).json({ message: 'Server error while creating thread' });
  }
});

// GET /api/discussions/:threadId - Fetch a single thread with comments
router.get('/:threadId', async (req, res) => {
  try {
    const thread = await Thread.findById(req.params.threadId)
                               .populate({ // Populate comments and sort them by creation date
                                 path: 'comments',
                                 options: { sort: { 'createdAt': 1 } } // Oldest comment first
                               });

    if (!thread) {
        return res.status(404).json({ message: 'Thread not found' });
    }
    res.json(thread);
  } catch (error) {
    console.error('Error fetching single thread:', error);
    // Handle invalid ObjectId format
    if (error.name === 'CastError') {
        return res.status(400).json({ message: 'Invalid thread ID format' });
    }
    res.status(500).json({ message: 'Server error while fetching thread' });
  }
});

// --- Comment Routes ---

// POST /api/discussions/:threadId/comments - Add a comment to a thread
router.post('/:threadId/comments', async (req, res) => {
  try {
    const { content, author } = req.body;
    const threadId = req.params.threadId;

    if (!content) {
        return res.status(400).json({ message: 'Comment content cannot be empty' });
    }

    // Check if thread exists before adding comment
    const threadExists = await Thread.findById(threadId);
    if (!threadExists) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    const newComment = new Comment({
        content,
        author, // Again, assuming author info comes from request later
        threadId
    });

    const savedComment = await newComment.save();

    // Add comment reference to the thread's comments array
    await Thread.findByIdAndUpdate(threadId, {
        $push: { comments: savedComment._id }
    });

    res.status(201).json(savedComment);
  } catch (error) {
    console.error('Error adding comment:', error);
    if (error.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation failed', errors: error.errors });
    }
    if (error.name === 'CastError') {
        return res.status(400).json({ message: 'Invalid thread ID format' });
    }
    res.status(500).json({ message: 'Server error while adding comment' });
  }
});

module.exports = router; 