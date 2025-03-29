# Record Club Server API

Backend API for the Record Club application built with Node.js, Express, and MongoDB.

## API Endpoints

### Test Endpoint

- **GET /api/test**
  - Returns a simple message to confirm the server is running
  - Response: `{ message: "Hello from server!" }`

### Albums Endpoints

- **GET /api/albums**
  - Retrieves all albums, sorted by most recently added first
  - Response: Array of album objects

- **POST /api/albums**
  - Creates a new album
  - Request Body:
    ```json
    {
      "title": "Album Title",
      "artist": "Artist Name",
      "releaseYear": 2023,
      "genre": ["Rock", "Alternative"],
      "coverArtUrl": "https://example.com/cover.jpg",
      "spotifyId": "spotify_album_id",
      "trivia": "Interesting facts about this album..."
    }
    ```
  - Response: The created album object with status code 201

## Environment Variables

Create a `.env` file in the server directory with the following variables:

```
PORT=5001
MONGO_URI=your_mongodb_connection_string_here
```

Replace `your_mongodb_connection_string_here` with your actual MongoDB connection string.

## Running the Server

```
npm run dev
```

This will start the server using nodemon, which automatically restarts when changes are detected. 