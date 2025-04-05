import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getPosts, deletePost } from '../services/postService';
import { AuthContext } from '../context/AuthContext';
import { format } from 'date-fns'; // For formatting dates

function DeepDivePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const fetchedPosts = await getPosts();
        setPosts(fetchedPosts);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch posts');
        console.error("Fetch posts error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handleDelete = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
        try {
            await deletePost(postId);
            setPosts(posts.filter(post => post._id !== postId)); // Update state
            // Optionally show a success message
        } catch (err) {
            setError(err.message || 'Failed to delete post');
            console.error("Delete post error:", err);
            // Optionally show an error message to the user
        }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-amber-400">Deep Dive</h1>
        {isAuthenticated && (
          <Link
            to="/deep-dive/new"
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-900 font-semibold py-2 px-5 rounded-md shadow-md transition duration-200"
          >
            Create New Post
          </Link>
        )}
      </div>

      {loading && <p className="text-center text-gray-400">Loading posts...</p>}
      {error && <p className="text-center text-red-500">Error: {error}</p>}

      {!loading && !error && (
        <div className="space-y-8">
          {posts.length === 0 ? (
            <p className="text-center text-gray-500">No deep dive posts yet. Be the first to create one!</p>
          ) : (
            posts.map((post) => (
              <article key={post._id} className="bg-slate-800 rounded-lg shadow-xl p-6 hover:shadow-amber-500/20 transition duration-300 ease-in-out transform hover:-translate-y-1">
                <h2 className="text-2xl font-semibold text-amber-400 mb-3">
                  <Link to={`/deep-dive/${post._id}`} className="hover:underline">
                    {post.title}
                  </Link>
                </h2>
                <div className="text-sm text-gray-400 mb-4">
                  <span>By {post.author?.username || 'Unknown Author'}</span>
                  <span className="mx-2">|</span>
                  <span>{format(new Date(post.createdAt), 'MMMM d, yyyy')}</span>
                </div>
                {/* Optional: Display an excerpt if available */}
                {/* <p className="text-gray-300 mb-4">{post.excerpt || 'No excerpt available...'}</p> */}
                <div className="flex justify-between items-center mt-4">
                  <Link
                    to={`/deep-dive/${post._id}`}
                    className="text-amber-500 hover:text-amber-400 font-medium transition-colors duration-200"
                  >
                    Read more &rarr;
                  </Link>
                  {/* Show Edit/Delete buttons only if user is the author or an admin */}
                  {isAuthenticated && (user?._id === post.author?._id || user?.role === 'admin') && (
                    <div className="space-x-3">
                        <button
                            onClick={() => navigate(`/deep-dive/edit/${post._id}`)} // Navigate to edit page (to be created)
                            className="text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200"
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => handleDelete(post._id)}
                            className="text-sm text-red-500 hover:text-red-400 transition-colors duration-200"
                        >
                            Delete
                        </button>
                    </div>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default DeepDivePage; 