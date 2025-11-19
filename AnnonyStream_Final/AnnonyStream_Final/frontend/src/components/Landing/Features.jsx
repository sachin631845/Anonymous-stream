import React from 'react';
import './Features.css';

const Features = () => {
  const features = [
    {
      icon: '🛡️',
      title: 'Safe & Moderated',
      description: 'Our communities are carefully moderated to ensure a safe and respectful environment for everyone.',
      color: '#10B981'
    },
    {
      icon: '🎭',
      title: 'Complete Anonymity',
      description: 'Share your thoughts freely without revealing your identity. Your privacy is our priority.',
      color: '#8B5CF6'
    },
    {
      icon: '🏘️',
      title: 'Diverse Communities',
      description: 'Join thousands of communities covering every interest imaginable. Find your people.',
      color: '#3B82F6'
    },
    {
      icon: '💬',
      title: 'Real Conversations',
      description: 'Engage in meaningful discussions with people who share your interests and passions.',
      color: '#EF4444'
    },
    {
      icon: '⚡',
      title: 'Real-time Interactions',
      description: 'Instant posts, comments, and reactions. Stay connected with your communities.',
      color: '#F59E0B'
    },
    {
      icon: '📱',
      title: 'Modern Experience',
      description: 'Beautiful, intuitive interface designed for seamless browsing and engagement.',
      color: '#06B6D4'
    }
  ];

  return (
    <div className="features-section">
      <div className="features-container">
        {/* Section Header */}
        <div className="features-header">
          <h2 className="features-title">
            Why Choose <span className="gradient-text">AnnonyStream</span>?
          </h2>
          <p className="features-subtitle">
            Experience the future of anonymous social networking with features designed for authentic connections
          </p>
        </div>

        {/* Features Grid */}
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div 
                className="feature-icon-wrapper"
                style={{ '--icon-color': feature.color }}
              >
                <span className="feature-icon">{feature.icon}</span>
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;