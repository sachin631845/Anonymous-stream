import React, { useState } from 'react';
import axios from 'axios';
import './CreateCommunity.css';

const CreateCommunity = ({ isOpen, onClose, onCommunityCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    guidelines: '',
    tags: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('Community name is required');
      setLoading(false);
      return;
    }

    if (formData.name.length < 3) {
      setError('Community name must be at least 3 characters');
      setLoading(false);
      return;
    }

    try {
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const response = await axios.post('http://localhost:5000/api/communities', {
        name: formData.name.trim(),
        description: formData.description.trim(),
        guidelines: formData.guidelines.trim(),
        tags: tagsArray
      });

      if (response.data.success) {
        onCommunityCreated(response.data.data);
        onClose();
        setFormData({ name: '', description: '', guidelines: '', tags: '' });
      }
    } catch (error) {
      setError(
        error.response?.data?.message || 
        'Error creating community. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', description: '', guidelines: '', tags: '' });
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="create-community-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Community</h2>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="community-form">
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name">Community Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter community name"
              required
              maxLength={50}
            />
            <div className="char-count">{formData.name.length}/50</div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your community..."
              rows="3"
              maxLength={200}
            />
            <div className="char-count">{formData.description.length}/200</div>
          </div>

          <div className="form-group">
            <label htmlFor="guidelines">Community Guidelines</label>
            <textarea
              id="guidelines"
              name="guidelines"
              value={formData.guidelines}
              onChange={handleInputChange}
              placeholder="Set some guidelines for your community..."
              rows="3"
              maxLength={300}
            />
            <div className="char-count">{formData.guidelines.length}/300</div>
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags</label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              placeholder="Enter tags separated by commas (e.g., technology, programming, web)"
            />
            <div className="input-hint">Separate tags with commas</div>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-btn"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="create-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Creating...
                </>
              ) : (
                'Create Community'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCommunity;