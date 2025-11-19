import React, { useState, useEffect } from 'react';
import './Profile.css';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ displayName: '', bio: '', avatar: '' });
  const [avatarPreview, setAvatarPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        displayName: user.profile?.displayName || user.username || '',
        bio: user.profile?.bio || '',
        avatar: user.profile?.avatar || ''
      });
      setAvatarPreview(user.profile?.avatar || '');
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // Live preview for avatar URL
    if (name === 'avatar') {
      setAvatarPreview(value);
    }
    setMessage('');
  };

  const handleAvatarFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Convert file to base64 data URL for preview and storage
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result;
        setAvatarPreview(dataUrl);
        setForm(prev => ({ ...prev, avatar: dataUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Use AuthContext helper to update and sync user
      const res = await updateProfile(form);
      if (res.success) {
        setMessage('Profile updated ✅');
      } else {
        setMessage(res.message || 'Update failed');
      }
    } catch (err) {
      setMessage('Error updating profile');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (!user) return (
    <div className="profile-card empty">
      <h3>Please log in to edit your profile</h3>
    </div>
  );

  return (
    <div className="profile-card">
      <div className="profile-header">
        <div className="avatar-large-container">
          {avatarPreview ? (
            <img src={avatarPreview} alt="avatar" className="avatar-image" onError={() => setAvatarPreview('')} />
          ) : (
            <div className="avatar-large">{(form.displayName || user.username || 'U').charAt(0).toUpperCase()}</div>
          )}
        </div>
        <div className="profile-meta">
          <h2>{form.displayName || user.username}</h2>
          <p className="email">{user.email}</p>
        </div>
      </div>

      <form className="profile-form" onSubmit={handleSave}>
        <label>Display Name</label>
        <input name="displayName" value={form.displayName} onChange={handleChange} />

        <label>Bio</label>
        <textarea name="bio" rows="4" value={form.bio} onChange={handleChange} />

        <label>Avatar Upload (or paste URL below)</label>
        <div className="avatar-upload">
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleAvatarFileUpload}
            className="file-input"
          />
          <span className="upload-hint">JPG, PNG, GIF up to 5MB</span>
        </div>

        <label>Avatar URL (alternative)</label>
        <input name="avatar" value={form.avatar} onChange={handleChange} placeholder="https://example.com/avatar.jpg" />

        <div className="form-actions">
          <button type="submit" className="save-btn" disabled={loading}>{loading ? 'Saving...' : 'Save Profile'}</button>
        </div>
        {message && <div className="profile-message">{message}</div>}
      </form>
    </div>
  );
};

export default Profile;
