import axios from 'axios';

// Remove the explicit API_URL construction. 
// Requests will use relative paths, relying on the CRA proxy for development
// and Netlify redirects/proxy for production.
// const BASE_API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5001').replace(/\/$/, '');
// const API_URL = `${BASE_API_URL}/api`; 

// Helper function to get the auth token from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
};

// Fetch all posts
export const getPosts = async () => {
  try {
    const response = await axios.get('/api/posts'); // Use relative path
    return response.data;
  } catch (error) {
    console.error('Error fetching posts:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Error fetching posts');
  }
};

// Fetch a single post by ID
export const getPostById = async (postId) => {
  try {
    const response = await axios.get(`/api/posts/${postId}`); // Use relative path
    return response.data;
  } catch (error) {
    console.error(`Error fetching post ${postId}:`, error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Error fetching post');
  }
};

// Create a new post
export const createPost = async (postData) => {
  try {
    const response = await axios.post('/api/posts', postData, { // Use relative path
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Error creating post:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Error creating post');
  }
};

// Update a post
export const updatePost = async (postId, postData) => {
  try {
    const response = await axios.put(`/api/posts/${postId}`, postData, { // Use relative path
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating post ${postId}:`, error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Error updating post');
  }
};

// Delete a post
export const deletePost = async (postId) => {
  try {
    const response = await axios.delete(`/api/posts/${postId}`, { // Use relative path
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error(`Error deleting post ${postId}:`, error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Error deleting post');
  }
}; 