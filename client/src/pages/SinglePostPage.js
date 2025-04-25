import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getPostById, deletePost } from '../services/postService';
import { AuthContext } from '../context/AuthContext';
import DOMPurify from 'dompurify';
import { format } from 'date-fns';
import '../App.css'; // Ensure general styles are applied if needed

function SinglePostPage() {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const fetchedPost = await getPostById(postId);
        setPost(fetchedPost);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch post');
        console.error(`Fetch post ${postId} error:`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
        try {
            await deletePost(postId);
            navigate('/deep-dive'); // Redirect to the list page after deletion
            // Optionally show a success message
        } catch (err) {
            setError(err.message || 'Failed to delete post');
            console.error("Delete post error:", err);
            // Optionally show an error message to the user
        }
    }
  };

  // Sanitize and render HTML content safely
  const createMarkup = (htmlContent) => {
    // Add target="_blank" to all links within the content
    const sanitizedHtml = DOMPurify.sanitize(htmlContent, {
        ADD_ATTR: ['target'], // Allow target attribute
    });
    // A slightly more robust way to add target="_blank" to <a> tags
    const parser = new DOMParser();
    const doc = parser.parseFromString(sanitizedHtml, 'text/html');
    doc.querySelectorAll('a').forEach(link => {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer'); // Security best practice for target="_blank"
        link.classList.add('text-amber-400', 'hover:underline'); // Style links
    });
    // Add styling to embedded YouTube iframes if needed (example)
    doc.querySelectorAll('iframe[src*="youtube.com"], iframe[src*="youtu.be"]').forEach(iframe => {
        iframe.classList.add('max-w-full', 'rounded', 'shadow-lg', 'my-4'); // Responsive iframe styling
        // Optionally wrap iframe for aspect ratio control (advanced)
    });
    
    return { __html: doc.body.innerHTML };
  };

  if (loading) return <p className="text-center text-gray-400 mt-10">Loading post...</p>;
  if (error) return <p className="text-center text-red-500 mt-10">Error: {error}</p>;
  if (!post) return <p className="text-center text-gray-500 mt-10">Post not found.</p>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <article className="bg-slate-800 rounded-lg shadow-xl p-6 sm:p-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-amber-400 mb-4">{post.title}</h1>
        <div className="text-sm text-gray-400 mb-6 border-b border-slate-700 pb-4">
          <span>By {post.author?.username || 'Unknown Author'}</span>
          <span className="mx-2">|</span>
          <span>Published on {format(new Date(post.createdAt), 'MMMM d, yyyy')}</span>
          {/* Show Edit/Delete buttons only if user is the author or an admin */}
          {isAuthenticated && (user?._id === post.author?._id || user?.role === 'admin') && (
            <div className="mt-3 space-x-3">
                <Link 
                    to={`/deep-dive/edit/${post._id}`}
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200"
                >
                    Edit Post
                </Link>
                <button
                    onClick={handleDelete}
                    className="text-sm text-red-500 hover:text-red-400 transition-colors duration-200"
                >
                    Delete Post
                </button>
            </div>
          )}
        </div>
        
        {/* Render sanitized content */}
        <div 
            className="prose prose-invert max-w-none text-gray-300 prose-headings:text-amber-400 prose-a:text-amber-500 hover:prose-a:text-amber-400 prose-strong:text-gray-100 prose-blockquote:border-l-amber-500 prose-code:text-pink-400 prose-pre:bg-slate-900 prose-table:border-collapse prose-table:w-full prose-td:border prose-td:border-slate-700 prose-td:p-2 prose-th:bg-slate-800 prose-th:border prose-th:border-slate-700 prose-th:p-2"
            dangerouslySetInnerHTML={createMarkup(post.content)}
        />

        <div className="mt-8 pt-4 border-t border-slate-700">
          <Link to="/deep-dive" className="text-amber-500 hover:text-amber-400 transition-colors duration-200">
            &larr; Back to Deep Dive
          </Link>
        </div>
      </article>
    </div>
  );
}

export default SinglePostPage; 