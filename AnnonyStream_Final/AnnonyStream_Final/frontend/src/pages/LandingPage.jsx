import React from 'react';
import HeroSection from '../components/Landing/HeroSection';
import AuthForm from '../components/Landing/AuthForm';
import Features from '../components/Landing/Features';
import '../App.css';

const LandingPage = () => {
  return (
    <div className="landing-page">
      <div className="landing-container">
        {/* Left Side - Hero Content */}
        <HeroSection />
        
        {/* Right Side - Auth Form */}
        <AuthForm />
      </div>
      
      {/* Features Section at Bottom */}
      <Features />
    </div>
  );
};

export default LandingPage;