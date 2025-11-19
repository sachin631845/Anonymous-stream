import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import './PostCard.css';

const PostCard = ({ post, onLike, onComment, onShare, onRefreshUser }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isLiking, setIsLiking] = useState(false);
  const [shareStatus, setShareStatus] = useState('');
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (user && post) {
      const saved = (user.savedPosts || []).some(id => id === post._id || id === post._id.toString());
      setIsSaved(saved);
    }
  }, [user, post]);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    await onLike(post._id);
    setIsLiking(false);
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    await onComment(post._id, commentText);
    setCommentText('');
    setShowComments(true);
  };

  const likeCount = post.likes?.length || 0;
  const commentCount = post.comments?.length || 0;

  const handleShare = async () => {
    const postUrl = `${window.location.origin}/posts/${post._id}`;

    // Try native share first
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.content?.slice(0, 140) || '',
          url: postUrl
        });
        if (onShare) onShare(post._id);
        return;
      } catch (err) {
        // User cancelled or share failed - fall back to clipboard
      }
    }

    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(postUrl);
      setShareStatus('Link copied to clipboard');
      setTimeout(() => setShareStatus(''), 2000);
      if (onShare) onShare(post._id);
      return;
    } catch (err) {
      // Final fallback: prompt so user can manually copy
      window.prompt('Copy this link', postUrl);
      if (onShare) onShare(post._id);
    }
  };

  return (
    <div className="post-card">
      {/* Post Header */}
      <div className="post-header">
        <div className="post-meta">
          <span className="community-name">{post.community?.name}</span>
          <span className="post-time">
            {new Date(post.createdAt).toLocaleDateString()} • {new Date(post.createdAt).toLocaleTimeString()}
          </span>
        </div>
        {post.isAnonymous && (
          <span className="anonymous-badge">Anonymous</span>
        )}
      </div>

      {/* Post Content */}
      <div className="post-content">
        <h3 className="post-title">{post.title}</h3>
        <p className="post-text">{post.content}</p>
        
        {post.tags && post.tags.length > 0 && (
          <div className="post-tags">
            {post.tags.map((tag, index) => (
              <span key={index} className="tag">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="post-actions">
        <button 
          className={`action-btn like-btn ${likeCount > 0 ? 'liked' : ''}`}
          onClick={handleLike}
          disabled={isLiking}
        >
          <span className="action-icon">❤️</span>
          <span className="action-count">{likeCount}</span>
        </button>
        
        <button 
          className="action-btn comment-btn"
          onClick={() => setShowComments(!showComments)}
        >
          <span className="action-icon">💬</span>
          <span className="action-count">{commentCount}</span>
        </button>
        
        <button className="action-btn share-btn" onClick={handleShare}>
          <span className="action-icon">↗️</span>
          <span>Share</span>
        </button>
        <button
          className={`action-btn bookmark-btn ${isSaved ? 'saved' : ''}`}
          onClick={async () => {
            try {
              const token = localStorage.getItem('token') || axios.defaults.headers.common?.Authorization?.replace('Bearer ', '');
              const res = await axios.post(`http://localhost:5000/api/posts/${post._id}/save`, {}, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              setIsSaved(prev => !prev);
              // Refresh user profile so savedPosts updates
              if (onRefreshUser) {
                onRefreshUser();
              }
            } catch (err) {
              console.error('Save error', err);
            }
          }}
        >
          <span className="action-icon">🔖</span>
          <span>{isSaved ? 'Saved' : 'Save'}</span>
        </button>
        {shareStatus && (
          <div className="share-status">{shareStatus}</div>
        )}
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="comments-section">
          {/* Add Comment Form */}
          <form onSubmit={handleCommentSubmit} className="comment-form">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              rows="2"
              className="comment-input"
            />
            <button 
              type="submit" 
              className="comment-submit-btn"
              disabled={!commentText.trim()}
            >
              Comment
            </button>
          </form>

          {/* Comments List */}
          <div className="comments-list">
            {post.comments && post.comments.length > 0 ? (
              post.comments.map((comment, index) => (
                <div key={index} className="comment">
                  <div className="comment-content">
                    <p className="comment-text">{comment.content}</p>
                    <div className="comment-meta">
                      <span className="comment-time">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-comments">
                <p>No comments yet. Be the first to comment!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;