import React from 'react';
import './HeroSection.css';

const HeroSection = () => {
  return (
    <div className="hero-section">
      <div className="hero-content">
        {/* Main Logo/Title */}
        <div className="hero-logo">
          <h1 className="main-title">
            Annony<span className="gradient-text">Stream</span>
          </h1>
          <div className="tagline">
            Where <span className="highlight">anonymous voices</span> find their communities
          </div>
        </div>

        {/* Description */}
        <div className="hero-description">
          <p>
            Welcome to AnnonyStream - your safe space for authentic conversations. 
            Share your thoughts, join meaningful communities, and connect with like-minded people 
            while maintaining your privacy and anonymity.
          </p>
        </div>

        {/* Key Features List */}
        <div className="features-list">
          <div className="feature-item">
            <span className="feature-icon">🛡️</span>
            <span className="feature-text">Safe & Moderated Communities</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🎭</span>
            <span className="feature-text">Complete Anonymity</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">💬</span>
            <span className="feature-text">Real Conversations</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🌐</span>
            <span className="feature-text">Diverse Communities</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;