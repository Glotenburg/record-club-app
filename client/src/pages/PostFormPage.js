import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Editor } from '@tinymce/tinymce-react';
import { createPost, getPostById, updatePost } from '../services/postService';
import { AuthContext } from '../context/AuthContext';

function PostFormPage() {
  const { postId } = useParams(); // Get postId from URL if editing
  const navigate = useNavigate();
  const { user, isAuthenticated } = useContext(AuthContext); // Need user for authorization check

  const [title, setTitle] = useState('');
  const [content, setContent] = useState(''); // State for editor content
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (postId) {
      setIsEditing(true);
      const fetchPostData = async () => {
        setLoading(true);
        try {
          const postData = await getPostById(postId);
          // Authorization check: Ensure the current user is the author or an admin
          if (isAuthenticated && (user?._id === postData.author?._id || user?.role === 'admin')) {
            setTitle(postData.title);
            setContent(postData.content);
          } else {
            setError('You are not authorized to edit this post.');
            // Optional: Redirect unauthorized user
            // navigate('/deep-dive'); 
          }
        } catch (err) {
          setError(err.message || 'Failed to fetch post data for editing');
          console.error("Fetch post for edit error:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchPostData();
    } else {
      // If not editing, ensure fields are clear (useful if navigating from edit to new)
      setIsEditing(false);
      setTitle('');
      setContent('');
    }
  }, [postId, user, isAuthenticated, navigate]); // Rerun if postId, user, or auth status changes

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); // Clear previous errors
    setLoading(true);

    const postData = { title, content };

    try {
      let savedPost;
      if (isEditing) {
        // Update existing post
        savedPost = await updatePost(postId, postData);
        navigate(`/deep-dive/${savedPost._id}`); // Navigate to the updated post
      } else {
        // Create new post
        savedPost = await createPost(postData);
        navigate(`/deep-dive/${savedPost._id}`); // Navigate to the newly created post
      }
    } catch (err) {
      setError(err.message || (isEditing ? 'Failed to update post' : 'Failed to create post'));
      console.error("Submit post error:", err);
    } finally {
      setLoading(false);
    }
  };

  // If loading post data for editing
  if (loading && isEditing) return <p className="text-center text-gray-400 mt-10">Loading editor...</p>;
  // If user is not authorized to edit
  if (error && error.includes('authorized')) return <p className="text-center text-red-500 mt-10">{error}</p>;
  // Don't render form if editing and error occurred during fetch (other than auth)
  if (error && isEditing) return <p className="text-center text-red-500 mt-10">Error loading post data: {error}</p>;


  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-amber-400 mb-6">{isEditing ? 'Edit Post' : 'Create New Post'}</h1>
      
      <form onSubmit={handleSubmit} className="bg-slate-800 rounded-lg shadow-xl p-6 space-y-6">
        {error && !error.includes('authorized') && <p className="text-red-500 text-sm">Error: {error}</p>} 
        
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent placeholder-gray-500"
            placeholder="Enter your post title"
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-1">
            Content
          </label>
          {/* TinyMCE Editor */}
          <div className="bg-slate-700 rounded-md overflow-hidden">
            <Editor
              apiKey="9w72hm3ieljb8enaqurfw321tdbx1zlewduq2m2ypgl9xjxw" // Added your API key
              initialValue={content}
              value={content}
              onEditorChange={(newContent) => setContent(newContent)}
              init={{
                height: 300,
                menubar: false, // Kept menubar false as per your previous setting
                skin: "oxide-dark", // Kept dark mode settings
                content_css: "dark",
                plugins: [
                  // Core editing features
                  'anchor', 'autolink', 'charmap', 'codesample', 'emoticons', 'image', 'link', 'lists', 'media', 'searchreplace', 'table', 'visualblocks', 'wordcount',
                  // Your account includes a free trial of TinyMCE premium features
                  'checklist', 'mediaembed', 'casechange', 'formatpainter', 'pageembed', 'a11ychecker', 'tinymcespellchecker', 'permanentpen', 'powerpaste', 'advtable', 'advcode', 'editimage', 'advtemplate', 'ai', 'mentions', 'tinycomments', 'tableofcontents', 'footnotes', 'mergetags', 'autocorrect', 'typography', 'inlinecss', 'markdown','importword', 'exportword', 'exportpdf'
                ],
                toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table mergetags | addcomment showcomments | spellcheckdialog a11ycheck typography | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat',
                placeholder: "Write your deep dive here... Tables and formatting from Google Docs will work here!", // Kept your placeholder
                paste_data_images: true, // Kept paste settings
                paste_enable_default_filters: true,
                paste_word_valid_elements: "table,tr,td,th,thead,tfoot,tbody,p,br,a,ul,ol,li,b,strong,i,em,h1,h2,h3,h4,h5,h6",
                // Added from TinyMCE snippet
                tinycomments_mode: 'embedded',
                tinycomments_author: user?.username || 'Guest User', // Use logged-in user's name or a default
                mergetags_list: [
                  { value: 'First.Name', title: 'First Name' },
                  { value: 'Email', title: 'Email' },
                ],
                ai_request: (request, respondWith) => respondWith.string(() => Promise.reject('AI Assistant needs configuration')),
              }}
            />
          </div>
        </div>

        <div className="flex justify-end pt-4"> {/* Added padding top for spacing */}
          <button
            type="button"
            onClick={() => navigate(isEditing ? `/deep-dive/${postId}` : '/deep-dive')} // Go back to post or list
            disabled={loading}
            className="mr-4 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-gray-200 rounded-md transition duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-900 font-semibold rounded-md shadow-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Post' : 'Create Post')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PostFormPage; 