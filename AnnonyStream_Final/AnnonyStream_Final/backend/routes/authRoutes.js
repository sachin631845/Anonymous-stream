const express = require('express');
const jwt = require('jsonwebtoken');
const Member = require('../models/member');

const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register new member
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if member exists
    const memberExists = await Member.findOne({
      $or: [{ email }, { username }]
    });

    if (memberExists) {
      return res.status(400).json({
        success: false,
        message: 'Member already exists with this email or username'
      });
    }

    // Create member
    const member = await Member.create({
      username,
      email,
      password,
      profile: {
        displayName: username
      }
    });

    if (member) {
      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          _id: member._id,
          username: member.username,
          email: member.email,
          profile: member.profile,
          token: generateToken(member._id)
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid member data'
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @desc    Authenticate member & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for member
    const member = await Member.findOne({ email });

    if (member && (await member.comparePassword(password))) {
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          _id: member._id,
          username: member.username,
          email: member.email,
          profile: member.profile,
          token: generateToken(member._id)
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @desc    Get current member profile
// @route   GET /api/auth/profile
// @access  Private (we'll add middleware later)
// GET /api/auth/profile - return current authenticated member profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const memberId = req.user.id;
    const member = await Member.findById(memberId)
      .select('-password')
      .populate('joinedCommunities', 'name')
      .populate('savedPosts');

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    res.json({
      success: true,
      data: {
        _id: member._id,
        username: member.username,
        email: member.email,
        profile: member.profile,
        joinedCommunities: member.joinedCommunities,
        savedPosts: member.savedPosts
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/auth/profile - update current member profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const memberId = req.user.id;
    const { displayName, bio, avatar } = req.body;

    const update = {
      'profile.displayName': displayName,
      'profile.bio': bio,
      'profile.avatar': avatar
    };

    const member = await Member.findByIdAndUpdate(
      memberId,
      { $set: update },
      { new: true, runValidators: true }
    ).select('-password');

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        _id: member._id,
        username: member.username,
        email: member.email,
        profile: member.profile
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;