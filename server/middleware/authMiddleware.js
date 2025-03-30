const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

/**
 * Protect routes - Middleware to verify JWT token and attach user to request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header ('Bearer TOKEN')
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch the user from the database (excluding password)
      const user = await User.findById(decoded.user.id).select('-password');
      
      if (!user) {
        return res.status(401).json({ msg: 'User not found' });
      }

      // Attach full user to the request object
      req.user = user;

      next(); // Move to the next middleware/route handler
    } catch (error) {
      console.error('Token verification failed:', error);
      res.status(401).json({ msg: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ msg: 'Not authorized, no token' });
  }
};

/**
 * Verify if user has admin role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const isAdmin = async (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Require Admin Role!' });
  }
};

module.exports = { protect, isAdmin }; 