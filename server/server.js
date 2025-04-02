// Load environment variables
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Routes
const albumRoutes = require('./routes/albums');
const spotifyRoutes = require('./routes/spotify');
const userRoutes = require('./routes/userRoutes');
const profileRoutes = require('./routes/profileRoutes');
const personalAlbumRoutes = require('./routes/personalAlbumRoutes');

// Initialize Express app
const app = express();

// --- CORRECTED CORS CONFIGURATION ---
const allowedOrigins = [
  'http://localhost:3000',                      // Allow local development frontend
  'https://remarkable-fairy-ca5075.netlify.app', // Allow your deployed Netlify frontend
  'https://listeners-club.se',                // Allow apex custom domain
  'https://www.listeners-club.se'             // Allow www custom domain
  // You could also potentially add process.env.CLIENT_URL here if you set it in Render,
  // but explicitly listing the known URL is often clearer during setup.
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    // Allow requests from allowed origins
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Log blocked origins for debugging (optional)
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cross-origin requests to include credentials like Authorization headers (for JWT)
  optionsSuccessStatus: 200 // For legacy browser support
}));
// --- END OF CORS CONFIGURATION ---


// Other Middleware
app.use(express.json()); // Make sure this comes after CORS middleware if requests need parsing first, though usually order doesn't matter much for these two.

// Define port
const PORT = process.env.PORT || 5001;

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Test API endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: "Hello from server!" });
});

// Use Routes
app.use('/api', userRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/spotify', spotifyRoutes);
app.use('/api', profileRoutes); // This route includes /api/profiles endpoints

// Add logging specifically before this route handler
app.use('/api/personal-albums', (req, res, next) => {
  console.log(`[DEBUG] Request received for /api/personal-albums path: ${req.method} ${req.originalUrl}`);
  next(); // Pass control to the actual router
}, personalAlbumRoutes); // Dedicated route for personal albums

// Log all registered routes for debugging
console.log('Registered routes:');
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});