import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on app start
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Refresh profile from server to get latest savedPosts/joinedCommunities
      (async () => {
        try {
          const resp = await axios.get('http://localhost:5000/api/auth/profile');
          if (resp.data.success) {
            const serverUser = resp.data.data;
            // keep token stored separately
            localStorage.setItem('user', JSON.stringify(serverUser));
            setUser(serverUser);
          } else {
            setUser(JSON.parse(userData));
          }
        } catch (err) {
          setUser(JSON.parse(userData));
        }
      })();
    }
    setLoading(false);

    // Listen for profile update event from PostCard
    const handleProfileUpdate = () => {
      const token = localStorage.getItem('token');
      if (token) {
        axios.get('http://localhost:5000/api/auth/profile')
          .then(resp => {
            if (resp.data.success) {
              const serverUser = resp.data.data;
              localStorage.setItem('user', JSON.stringify(serverUser));
              setUser(serverUser);
            }
          })
          .catch(err => console.error('Error refetching profile', err));
      }
    };

    window.addEventListener('userProfileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('userProfileUpdated', handleProfileUpdate);
  }, []);

  // Register function
  const register = async (userData) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', userData);
      
      if (response.data.success) {
        const { token, ...user } = response.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        return { success: true, data: response.data };
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  // Login function
  const login = async (credentials) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', credentials);
      
      if (response.data.success) {
        const { token, ...user } = response.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        return { success: true, data: response.data };
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  // Update profile
  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put('http://localhost:5000/api/auth/profile', profileData);
      if (response.data.success) {
        const updated = response.data.data;
        // Keep token unchanged, update local user
        const token = localStorage.getItem('token');
        const userObj = {
          _id: updated._id,
          username: updated.username,
          email: updated.email,
          profile: updated.profile
        };
        localStorage.setItem('user', JSON.stringify(userObj));
        setUser(userObj);
        if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        return { success: true, data: updated };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Profile update failed' };
    }
  };

  const value = {
    user,
    register,
    login,
    logout,
    updateProfile,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};