import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CommunityCard from '../components/Communities/CommunityCard';
import PostCard from '../components/Posts/PostCard';
import CreateCommunity from '../components/Communities/CreateCommunity';
import CreatePost from '../components/Posts/CreatePost'; // ✅ ADD THIS
import axios from 'axios';
import './Dashboard.css';
import Profile from '../components/Profile/Profile';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('feed');
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false); // ✅ ADD THIS
  const [selectedCommunity, setSelectedCommunity] = useState(null); // ✅ ADD THIS

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [filterCommunityId, setFilterCommunityId] = useState('');
  const [filterAnonymous, setFilterAnonymous] = useState('');

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);


  // Auth headers helper: prefer axios default Authorization, then localStorage token
  const getAuthHeaders = () => {
    const axiosAuth = axios.defaults.headers?.common?.Authorization;
    const token = axiosAuth?.replace('Bearer ', '') || localStorage.getItem('token');
    return {
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    };
  };

  useEffect(() => {
    fetchCommunities();
    fetchAllPosts();
    if (user) fetchNotifications();
  }, []);
  useEffect(() => {
  if (communities.length > 0) {
    fetchAllPosts();
  }
}, [communities]);

  useEffect(() => {
    // refetch notifications when user changes
    if (user) fetchNotifications();
  }, [user]);


  const fetchCommunities = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/communities');
      if (response.data.success) {
        setCommunities(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const resp = await axios.get('http://localhost:5000/api/notifications');
      if (resp.data.success) {
        setNotifications(resp.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching notifications', err);
    }
  };

  const fetchAllPosts = async () => {
  setPostsLoading(true);
  try {
    // Get communities where user is a member
    const userCommunities = communities.filter(community => 
      community.members?.some(member => member._id === user?._id || member._id === user?.id)
    );
    
    if (userCommunities.length > 0) {
      // Fetch posts from ALL user's communities
      const postPromises = userCommunities.map(community => 
        axios.get(`http://localhost:5000/api/posts/community/${community._id}`)
      );
      
      const responses = await Promise.all(postPromises);
      
      // Combine all posts from all communities
      const allPosts = responses.flatMap(response => 
        response.data.success ? response.data.data : []
      );
      
      // Sort by creation date (newest first)
      const sortedPosts = allPosts.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      setPosts(sortedPosts);
    } else {
      // User hasn't joined any communities
      setPosts([]);
    }
  } catch (error) {
    console.error('Error fetching posts:', error);
    setPosts([]);
  } finally {
    setPostsLoading(false);
  }
};

  const handleJoinCommunity = async (communityId) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/communities/${communityId}/join`,
        {},
        getAuthHeaders()
      );
      if (response.data.success) {
        alert('🎉 Successfully joined community!');
        fetchCommunities();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error joining community. Please try again.');
    }
  };

  const handleLeaveCommunity = async (communityId) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/communities/${communityId}/leave`,
        {},
        getAuthHeaders()
      );
      if (response.data.success) {
        alert('👋 Successfully left community!');
        fetchCommunities();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error leaving community. Please try again.');
    }
  };

  // ✅ ADD CREATE POST HANDLER
  const handleCreatePost = (community) => {
    setSelectedCommunity(community);
    setShowCreatePost(true);
  };

  // ✅ ADD POST CREATED HANDLER
  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
    alert('📝 Post created successfully!');
  };

  const handleLikePost = async (postId) => {
    try {
      const response = await axios.post(`http://localhost:5000/api/posts/${postId}/like`, {}, getAuthHeaders());
      if (response.data.success) {
        fetchAllPosts();
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleCommentPost = async (postId, commentText) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/posts/${postId}/comment`,
        { content: commentText },
        getAuthHeaders()
      );
      if (response.data.success) {
        fetchAllPosts();
      }
    } catch (error) {
      console.error('Error commenting on post:', error);
    }
  };

  const handleCreateCommunity = (newCommunity) => {
    setCommunities(prev => [newCommunity, ...prev]);
    alert('🎉 Community created successfully!');
  };

  const refreshUserProfile = async () => {
    try {
      const resp = await axios.get('http://localhost:5000/api/auth/profile');
      if (resp.data.success) {
        // Update user in localStorage and context (context will detect change and update)
        const userData = resp.data.data;
        localStorage.setItem('user', JSON.stringify(userData));
        // Force re-render by updating user state in a way that component re-reads
        // This is a bit hacky but works: we update window and then the useAuth hook picks it up via localStorage
        // Better: dispatch to AuthContext, but for now we'll refetch via axios
        window.dispatchEvent(new Event('userProfileUpdated'));
      }
    } catch (err) {
      console.error('Error refreshing profile', err);
    }
  };

  // Derived posts according to search/filters
  const displayedPosts = posts.filter(p => {
    // community filter
    if (filterCommunityId && p.community?._id !== filterCommunityId) return false;
    // anonymous filter
    if (filterAnonymous === 'only' && !p.isAnonymous) return false;
    // tag filter
    if (filterTag && !(p.tags || []).some(t => t.toLowerCase().includes(filterTag.toLowerCase()))) return false;
    // search query matches title, content, community name
    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const inTitle = p.title?.toLowerCase().includes(q);
      const inContent = p.content?.toLowerCase().includes(q);
      const inCommunity = p.community?.name?.toLowerCase().includes(q);
      return inTitle || inContent || inCommunity;
    }
    return true;
  });

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="brand">
            <h1>Annony<span>Stream</span></h1>
          </div>

          {/* Search + Filters */}
          <div className="header-search">
            <input
              type="text"
              placeholder="Search posts or communities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select value={filterCommunityId} onChange={(e) => setFilterCommunityId(e.target.value)}>
              <option value="">All communities</option>
              {communities.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Filter by tag (e.g. help)"
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
            />
            <label className="filter-anon">
              <input type="checkbox" checked={filterAnonymous === 'only'} onChange={(e) => setFilterAnonymous(e.target.checked ? 'only' : '')} />
              Anonymous only
            </label>
          </div>

          <div className="user-menu">
            <div className="notifications">
              <button className="notif-btn" onClick={() => setShowNotifications(prev => !prev)}>
                🔔
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="notif-count">{notifications.filter(n => !n.isRead).length}</span>
                )}
              </button>
              {showNotifications && (
                <div className="notif-dropdown">
                  {notifications.length === 0 ? (
                    <div className="notif-empty">No notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n._id} className={`notif-item ${n.isRead ? 'read' : 'unread'}`}>
                        <div className="notif-text">{n.message} {n.post && <strong>"{n.post.title}"</strong>}</div>
                        <div className="notif-meta">{new Date(n.createdAt).toLocaleString()}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="user-info">
              <button 
                className="avatar-btn"
                onClick={() => setActiveTab('profile')}
                title="Go to profile"
              >
                {user?.profile?.avatar ? (
                  <img src={user.profile.avatar} alt="avatar" className="avatar-img" onError={(e) => e.target.style.display = 'none'} />
                ) : (
                  <div className="avatar">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>
              <div className="user-details">
                <span className="username">@{user?.username}</span>
                <span className="user-email">{user?.email}</span>
              </div>
            </div>
            <button onClick={logout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="dashboard-main">
        {/* Sidebar */}
        <aside className="sidebar">
          <nav className="sidebar-nav">
            <button 
              className={`nav-item ${activeTab === 'feed' ? 'active' : ''}`}
              onClick={() => setActiveTab('feed')}
            >
              <span className="nav-icon">🏠</span>
              <span className="nav-text">Your Feed</span>
            </button>
            <button 
              className={`nav-item ${activeTab === 'communities' ? 'active' : ''}`}
              onClick={() => setActiveTab('communities')}
            >
              <span className="nav-icon">🏘️</span>
              <span className="nav-text">Communities</span>
            </button>
            <button 
              className={`nav-item ${activeTab === 'posts' ? 'active' : ''}`}
              onClick={() => setActiveTab('posts')}
            >
              <span className="nav-icon">📝</span>
              <span className="nav-text">All Posts</span>
            </button>
            <button 
              className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <span className="nav-icon">👤</span>
              <span className="nav-text">Profile</span>
            </button>
            <button 
              className={`nav-item ${activeTab === 'saved' ? 'active' : ''}`}
              onClick={() => setActiveTab('saved')}
            >
              <span className="nav-icon">📌</span>
              <span className="nav-text">Saved</span>
            </button>
          </nav>
        </aside>

        {/* Content Area */}
        <main className="content-area">
          {/* Welcome Banner */}
          <div className="welcome-banner">
            <div className="welcome-content">
              <h2>Welcome back, {user?.username}! 👋</h2>
              <p>Discover anonymous conversations and share your thoughts freely</p>
            </div>
            <div className="welcome-stats">
              <div className="stat-card">
                <div className="stat-icon">🏘️</div>
                <div className="stat-info">
                  <div className="stat-number">{communities.length}</div>
                  <div className="stat-label">Communities</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📝</div>
                <div className="stat-info">
                  <div className="stat-number">{posts.length}</div>
                  <div className="stat-label">Posts</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">💬</div>
                <div className="stat-info">
                  <div className="stat-number">
                    {posts.reduce((total, post) => total + (post.comments?.length || 0), 0)}
                  </div>
                  <div className="stat-label">Comments</div>
                </div>
              </div>
            </div>
          </div>

          {/* Feed Tab */}
{activeTab === 'feed' && (
  <section className="feed-section">
    <div className="section-header">
      <div className="header-left">
        <h3>Your Feed</h3>
        <p>Latest posts from communities you've joined</p>
      </div>
      {/* REMOVED Create Post button from header */}
    </div>

    {postsLoading ? (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading posts...</p>
      </div>
    ) : displayedPosts.length > 0 ? (
      <div className="posts-container">
        {displayedPosts.map(post => (
          <PostCard 
            key={post._id}
            post={post}
            onLike={handleLikePost}
            onComment={handleCommentPost}
            onRefreshUser={refreshUserProfile}
          />
        ))}
      </div>
    ) : (
      <div className="empty-state">
        <div className="empty-icon">📝</div>
        <h4>Your feed is empty</h4>
        <p>Join communities to see posts from other members!</p>
        <div className="empty-state-actions">
          <button 
            className="explore-communities-btn primary"
            onClick={() => setActiveTab('communities')}
          >
            Explore Communities
          </button>
          <p className="empty-state-hint">
            or create a post in communities you've already joined
          </p>
        </div>
      </div>
    )}
  </section>
)}

{activeTab === 'saved' && (
  <section className="saved-section">
    <div className="section-header">
      <div className="header-left">
        <h3>Saved Posts</h3>
        <p>Posts you bookmarked to read later</p>
      </div>
    </div>

    {user?.savedPosts && user.savedPosts.length > 0 ? (
      <div className="posts-container">
        {user?.savedPosts && user.savedPosts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            onLike={handleLikePost}
            onComment={handleCommentPost}
            onRefreshUser={refreshUserProfile}
          />
        ))}
      </div>
    ) : (
      <div className="empty-state">
        <div className="empty-icon">📌</div>
        <h4>No saved posts</h4>
        <p>Save posts to see them here later.</p>
      </div>
    )}
  </section>
)}

          {/* Communities Tab */}
          {activeTab === 'communities' && (
            <section className="communities-section">
              <div className="section-header">
                <div className="header-left">
                  <h3>Discover Communities</h3>
                  <p>Join communities to start sharing your thoughts anonymously</p>
                </div>
                <button 
                  className="create-community-btn"
                  onClick={() => setShowCreateCommunity(true)}
                >
                  + Create Community
                </button>
              </div>

              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading communities...</p>
                </div>
              ) : (
                <div className="communities-grid">
                  {communities.length > 0 ? (
                    communities.map(community => (
                      <CommunityCard 
                        key={community._id} 
                        community={community}
                        onJoin={handleJoinCommunity}
                        onLeave={handleLeaveCommunity}
                        onCreatePost={handleCreatePost} // ✅ ADD THIS
                      />
                    ))
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">🏘️</div>
                      <h4>No communities yet</h4>
                      <p>Be the first to create a community and start the conversation!</p>
                      <button 
                        className="create-community-btn primary"
                        onClick={() => setShowCreateCommunity(true)}
                      >
                        Create First Community
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* All Posts Tab */}
          {activeTab === 'posts' && (
            <section className="posts-section">
              <div className="section-header">
                <h3>All Posts</h3>
                <p>See what everyone is talking about</p>
              </div>

              {postsLoading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading posts...</p>
                </div>
              ) : posts.length > 0 ? (
                <div className="posts-container">
                  {posts.map(post => (
                    <PostCard 
                      key={post._id}
                      post={post}
                      onLike={handleLikePost}
                      onComment={handleCommentPost}
                      onRefreshUser={refreshUserProfile}
                    />
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📝</div>
                  <h4>No posts yet</h4>
                  <p>Be the first to create a post!</p>
                </div>
              )}
            </section>
          )}

          {/* Other Tabs Placeholder */}
          {activeTab === 'profile' && (
            <section className="profile-section">
              <Profile />
            </section>
          )}
        </main>
      </div>

      {/* Create Community Modal */}
      <CreateCommunity 
        isOpen={showCreateCommunity}
        onClose={() => setShowCreateCommunity(false)}
        onCommunityCreated={handleCreateCommunity}
      />

      {/* ✅ ADD CREATE POST MODAL */}
      <CreatePost 
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        community={selectedCommunity}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
};

export default Dashboard;