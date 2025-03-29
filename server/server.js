// Load environment variables
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Routes
const albumRoutes = require('./routes/albums');
const spotifyRoutes = require('./routes/spotify');
const userRoutes = require('./routes/users');

// Initialize Express app
const app = express();

// Middleware
// Define allowed origins based on environment
/* 
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  'http://localhost:5001' // Temporarily add backend origin
];

const corsOptions = {
  origin: function (origin, callback) {
    console.log('DEBUG CORS - Request Origin:', origin);
    console.log('DEBUG CORS - Allowed Origins:', allowedOrigins);
    // Allow requests with no origin (like mobile apps or curl requests) or from allowed origins
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200 // For legacy browser support
  // credentials: true // Uncomment if you need to send cookies/auth headers across domains later
};
*/

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000', // Allow CLIENT_URL or localhost:3000
  optionsSuccessStatus: 200 // For legacy browser support
  // credentials: true // Uncomment later if needed for cross-domain cookies
}));
app.use(express.json());

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
app.use('/api/users', userRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/spotify', spotifyRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 