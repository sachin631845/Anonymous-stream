import React from 'react';
import { useAuth } from '../../context/AuthContext';
import './CommunityCard.css';

const CommunityCard = ({ community, onJoin, onLeave, onCreatePost }) => {
  const { user } = useAuth();
  const memberCount = community.members?.length || 0;
  
  // CHECK IF CURRENT USER IS A MEMBER
  const isMember = community.members?.some(member => 
    member._id === user?._id || member._id === user?.id
  );

  return (
    <div className="community-card">
      <div className="community-header">
        <div className="community-avatar">
          {community.name.charAt(0).toUpperCase()}
        </div>
        <div className="community-info">
          <h3 className="community-name">{community.name}</h3>
          <p className="community-description">{community.description}</p>
        </div>
      </div>

      <div className="community-stats">
        <div className="stat">
          <span className="stat-number">{memberCount}</span>
          <span className="stat-label">members</span>
        </div>
        <div className="stat">
          <span className="stat-number">{community.tags?.length || 0}</span>
          <span className="stat-label">topics</span>
        </div>
      </div>

      <div className="community-tags">
        {community.tags?.map((tag, index) => (
          <span key={index} className="tag">
            #{tag}
          </span>
        ))}
      </div>

      {/* SMART BUTTONS - Shows Join/Leave + Create Post based on membership */}
      <div className="community-actions">
        <button 
          className={isMember ? "leave-btn" : "join-btn"}
          onClick={() => isMember ? onLeave(community._id) : onJoin(community._id)}
        >
          {isMember ? 'Leave Community' : 'Join Community'}
        </button>
        
        {/* ✅ ADD CREATE POST BUTTON FOR MEMBERS */}
        {isMember && (
          <button 
            className="create-post-btn-card"
            onClick={() => onCreatePost(community)}
          >
            + Create Post
          </button>
        )}
      </div>
    </div>
  );
};

export default CommunityCard;