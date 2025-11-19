const express = require('express');
const Community = require('../models/community');
const Member = require('../models/member');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Get all communities (public - no auth needed)
router.get('/', async (req, res) => {
  try {
    const communities = await Community.find({ isPublic: true })
      .populate('creator', 'username profile')
      .populate('members', 'username profile')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: communities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching communities'
    });
  }
});

// Create community (protected)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, guidelines, tags } = req.body;

    // Check if community exists
    const existingCommunity = await Community.findOne({ name });
    if (existingCommunity) {
      return res.status(400).json({
        success: false,
        message: 'Community with this name already exists'
      });
    }

    // Use authenticated user ID from middleware
    const creatorId = req.user.id;

    const community = await Community.create({
      name,
      description,
      guidelines,
      tags,
      creator: creatorId
    });

    const populatedCommunity = await Community.findById(community._id)
      .populate('creator', 'username profile')
      .populate('members', 'username profile');

    res.status(201).json({
      success: true,
      message: 'Community created successfully',
      data: populatedCommunity
    });
  } catch (error) {
    console.error('Error creating community:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating community'
    });
  }
});

// Join community (protected)
router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const communityId = req.params.id;
    const memberId = req.user.id; // From auth middleware

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }

    // Check if already a member
    if (community.members.includes(memberId)) {
      return res.status(400).json({
        success: false,
        message: 'Already a member of this community'
      });
    }

    // Add member to community
    community.members.push(memberId);
    await community.save();

    // Add community to member's joined communities
    await Member.findByIdAndUpdate(memberId, {
      $addToSet: { joinedCommunities: communityId }
    });

    const updatedCommunity = await Community.findById(communityId)
      .populate('creator', 'username profile')
      .populate('members', 'username profile');

    res.json({
      success: true,
      message: 'Successfully joined community',
      data: updatedCommunity
    });
  } catch (error) {
    console.error('Error joining community:', error);
    res.status(500).json({
      success: false,
      message: 'Error joining community'
    });
  }
});

// Leave community (protected) - ADD THIS ROUTE
router.post('/:id/leave', authMiddleware, async (req, res) => {
  try {
    const communityId = req.params.id;
    const memberId = req.user.id;

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }

    // Check if user is a member
    if (!community.members.includes(memberId)) {
      return res.status(400).json({
        success: false,
        message: 'You are not a member of this community'
      });
    }

    // Remove member from community
    community.members = community.members.filter(id => id.toString() !== memberId);
    await community.save();

    // Remove community from member's joined communities
    try {
      await Member.findByIdAndUpdate(memberId, {
        $pull: { joinedCommunities: communityId }
      });
    } catch (memberError) {
      console.log('Member update failed (but continuing):', memberError.message);
    }

    const updatedCommunity = await Community.findById(communityId)
      .populate('creator', 'username profile')
      .populate('members', 'username profile');

    res.json({
      success: true,
      message: 'Successfully left community',
      data: updatedCommunity
    });
  } catch (error) {
    console.error('Error leaving community:', error);
    res.status(500).json({
      success: false,
      message: 'Error leaving community'
    });
  }
});

module.exports = router;