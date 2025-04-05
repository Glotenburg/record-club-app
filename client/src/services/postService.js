import axios from 'axios';

// Ensure the base URL ends without a slash, and we add /api later
const BASE_API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5001').replace(/\/$/, '');
const API_URL = `${BASE_API_URL}/api`; // Append /api here

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
    const response = await axios.get(`${API_URL}/posts`);
    return response.data;
  } catch (error) {
    console.error('Error fetching posts:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Error fetching posts');
  }
};

// Fetch a single post by ID
export const getPostById = async (postId) => {
  try {
    const response = await axios.get(`${API_URL}/posts/${postId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching post ${postId}:`, error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Error fetching post');
  }
};

// Create a new post
export const createPost = async (postData) => {
  try {
    const response = await axios.post(`${API_URL}/posts`, postData, {
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
    const response = await axios.put(`${API_URL}/posts/${postId}`, postData, {
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
    const response = await axios.delete(`${API_URL}/posts/${postId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error(`Error deleting post ${postId}:`, error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Error deleting post');
  }
}; 