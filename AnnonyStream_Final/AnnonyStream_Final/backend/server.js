const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const notificationsRoutes = require('./routes/notificationsRoutes');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/annonystream', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.log('❌ MongoDB connection error:', err));
// Temporary route to create test member (remove later)
app.post('/api/test/create-member', async (req, res) => {
  try {
    const Member = require('./models/member');
    const testMember = await Member.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });
    res.json({
      success: true,
      message: 'Test member created',
      memberId: testMember._id
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating test member'
    });
  }
});
// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'AnnonyStream Backend is running!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      communities: '/api/communities',
      posts: '/api/posts'
    }
  });
});

// Import routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/communities', require('./routes/communityRoutes'));
app.use('/api/posts', require('./routes/postRoutes')); // ✅ Fixed - only once
app.use('/api/notifications', notificationsRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API Base URL: http://localhost:${PORT}`);
  console.log(`🔗 MongoDB: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/annonystream'}`);
});