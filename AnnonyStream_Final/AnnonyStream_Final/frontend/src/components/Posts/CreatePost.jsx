import React, { useState } from 'react';
import axios from 'axios';
import './CreatePost.css';

const CreatePost = ({ isOpen, onClose, community, onPostCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isAnonymous: true,
    tags: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auth headers function
  const getAuthHeaders = () => {
    // Prefer axios default header, fall back to localStorage token
    const axiosAuth = axios.defaults.headers?.common?.Authorization;
    const token = axiosAuth?.replace('Bearer ', '') || localStorage.getItem('token');
    return {
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    };
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.title.trim()) {
      setError('Post title is required');
      setLoading(false);
      return;
    }

    if (!formData.content.trim()) {
      setError('Post content is required');
      setLoading(false);
      return;
    }

    if (formData.title.length < 5) {
      setError('Title must be at least 5 characters');
      setLoading(false);
      return;
    }

    try {
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const response = await axios.post(
        'http://localhost:5000/api/posts',
        {
          title: formData.title.trim(),
          content: formData.content.trim(),
          communityId: community._id,
          tags: tagsArray,
          isAnonymous: formData.isAnonymous
        },
        getAuthHeaders()
      );

      if (response.data.success) {
        onPostCreated(response.data.data);
        onClose();
        setFormData({ title: '', content: '', isAnonymous: true, tags: '' });
      }
    } catch (error) {
      setError(
        error.response?.data?.message || 
        'Error creating post. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ title: '', content: '', isAnonymous: true, tags: '' });
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay post-modal-overlay" onClick={handleClose}>
      <div className="create-post-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Post</h2>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>

        <div className="post-community-info">
          <span className="community-badge">In: {community.name}</span>
        </div>

        <form onSubmit={handleSubmit} className="post-form">
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="title">Post Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter a catchy title for your post..."
              required
              maxLength={200}
              disabled={loading}
            />
            <div className="char-count">{formData.title.length}/200</div>
          </div>

          <div className="form-group">
            <label htmlFor="content">Post Content *</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="Share your thoughts, questions, or experiences..."
              rows="6"
              required
              maxLength={5000}
              disabled={loading}
            />
            <div className="char-count">{formData.content.length}/5000</div>
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags (Optional)</label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              placeholder="Enter tags separated by commas (e.g., question, advice, discussion)"
              disabled={loading}
            />
            <div className="input-hint">Separate tags with commas</div>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isAnonymous"
                checked={formData.isAnonymous}
                onChange={handleInputChange}
                disabled={loading}
              />
              <span className="checkmark"></span>
              Post anonymously
            </label>
            <div className="checkbox-hint">
              Your username will be hidden from other members
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-btn"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="create-post-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Creating...
                </>
              ) : (
                'Create Post'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;