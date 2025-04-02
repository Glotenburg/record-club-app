import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Assuming axios is installed

// Basic styling (can be moved to a separate CSS file)
const styles = {
  container: {
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  threadList: {
    listStyle: 'none',
    padding: 0,
  },
  threadItem: {
    border: '1px solid #ccc',
    borderRadius: '4px',
    marginBottom: '10px',
    padding: '10px',
  },
  threadTitle: {
    fontSize: '1.2em',
    marginBottom: '5px',
  },
  threadMeta: {
    fontSize: '0.8em',
    color: '#555',
  },
  form: {
    marginTop: '20px',
    border: '1px solid #eee',
    padding: '15px',
    borderRadius: '4px',
  },
  input: {
    display: 'block',
    width: 'calc(100% - 22px)', // Adjust for padding/border
    padding: '10px',
    marginBottom: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
  },
  textarea: {
    display: 'block',
    width: 'calc(100% - 22px)', // Adjust for padding/border
    padding: '10px',
    marginBottom: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    minHeight: '80px',
  },
  button: {
    padding: '10px 15px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  error: {
    color: 'red',
  },
  loading: {
    fontStyle: 'italic',
  }
};

function DiscussionPage() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Define API base URL - adjust if your server runs elsewhere
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  // Fetch threads when component mounts
  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/discussions`);
      setThreads(response.data);
    } catch (err) {
      console.error("Error fetching threads:", err);
      setError('Failed to load discussion threads. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle new thread form submission
  const handleCreateThread = async (e) => {
    e.preventDefault();
    if (!newThreadTitle.trim() || !newThreadContent.trim()) {
      setError('Please provide both a title and content for the thread.');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      // Ideally, get author from auth context, using 'Anonymous' for now
      const response = await axios.post(`${API_BASE_URL}/api/discussions`, {
        title: newThreadTitle,
        content: newThreadContent,
        author: 'Anonymous', // Placeholder
        // albumId: null // Add if linking to specific album
      });
      // Add the new thread to the top of the list optimistically or re-fetch
      setThreads([response.data, ...threads]);
      setNewThreadTitle('');
      setNewThreadContent('');
      // Optionally: fetchThreads(); // Re-fetch to ensure consistency
    } catch (err) {
      console.error("Error creating thread:", err);
      setError('Failed to create thread. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div style={styles.container}>
      <h1>Current Discussion</h1>

      {/* Form to Create New Thread */}
      <form onSubmit={handleCreateThread} style={styles.form}>
        <h2>Start a New Discussion</h2>
        <input
          type="text"
          placeholder="Thread Title"
          value={newThreadTitle}
          onChange={(e) => setNewThreadTitle(e.target.value)}
          disabled={isSubmitting}
          style={styles.input}
          required
        />
        <textarea
          placeholder="What's on your mind?"
          value={newThreadContent}
          onChange={(e) => setNewThreadContent(e.target.value)}
          disabled={isSubmitting}
          style={styles.textarea}
          required
        />
        <button type="submit" disabled={isSubmitting} style={styles.button}>
          {isSubmitting ? 'Posting...' : 'Post Thread'}
        </button>
        {error && <p style={styles.error}>{error}</p>}
      </form>


      {/* List of Threads */}
      <h2>Active Threads</h2>
      {loading && <p style={styles.loading}>Loading threads...</p>}
      {!loading && threads.length === 0 && <p>No discussions started yet. Be the first!</p>}

      <ul style={styles.threadList}>
        {threads.map(thread => (
          <li key={thread._id} style={styles.threadItem}>
            <h3 style={styles.threadTitle}>{thread.title}</h3>
            <p>{thread.content.substring(0, 150)}{thread.content.length > 150 ? '...' : ''}</p> {/* Preview content */}
            <div style={styles.threadMeta}>
              Posted by {thread.author} on {new Date(thread.createdAt).toLocaleDateString()}
              {/* We'll add comment count and link to view thread later */}
              {/* <span> | {thread.comments.length} Comments</span> */}
            </div>
          </li>
        ))}
      </ul>

      {/* We will add selected thread view and comment section here later */}

    </div>
  );
}

export default DiscussionPage; 