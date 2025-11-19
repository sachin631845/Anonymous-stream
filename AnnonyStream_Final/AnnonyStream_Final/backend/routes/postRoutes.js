const express = require('express');
const Post = require('../models/Post');
const Community = require('../models/community');
const Notification = require('../models/notification');
const authMiddleware = require('../middleware/authMiddleware'); // ✅ ADD THIS

const router = express.Router();

// @desc    Get posts for a community
// @route   GET /api/posts/community/:communityId
// @access  Public
router.get('/community/:communityId', async (req, res) => {
  try {
    const { communityId } = req.params;
    
    const posts = await Post.find({ community: communityId })
      .populate('author', 'username profile')
      .populate('community', 'name')
      .populate('comments.author', 'username profile')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: posts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching posts'
    });
  }
});

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
router.post('/', authMiddleware, async (req, res) => { // ✅ ADD AUTH MIDDLEWARE
  try {
    const { title, content, communityId, tags, isAnonymous = true } = req.body;

    // Check if community exists
    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }

    // ✅ USE AUTHENTICATED USER ID
    const authorId = req.user.id;

    const post = await Post.create({
      title,
      content,
      author: authorId,
      community: communityId,
      tags,
      isAnonymous
    });

    const populatedPost = await Post.findById(post._id)
      .populate('author', 'username profile')
      .populate('community', 'name');

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: populatedPost
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating post'
    });
  }
});

// @desc    Like a post
// @route   POST /api/posts/:postId/like
// @access  Private
router.post('/:postId/like', authMiddleware, async (req, res) => { // ✅ ADD AUTH
  try {
    const { postId } = req.params;
    const memberId = req.user.id; // ✅ USE AUTHENTICATED USER

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if already liked
    const alreadyLiked = post.likes.includes(memberId);
    
    if (alreadyLiked) {
      // Unlike
      post.likes = post.likes.filter(id => id.toString() !== memberId);
    } else {
      // Like
      post.likes.push(memberId);
    }

    await post.save();

    // Create notification for the post author (if not the liker)
    try {
      const postAuthorId = post.author.toString();
      if (postAuthorId !== memberId) {
        await Notification.create({
          recipient: postAuthorId,
          type: 'like',
          actor: memberId,
          post: postId,
          message: `Someone ${alreadyLiked ? 'unliked' : 'liked'} your post.`
        });
      }
    } catch (notifErr) {
      console.error('Notification error (like):', notifErr.message);
    }

    const updatedPost = await Post.findById(postId)
      .populate('author', 'username profile')
      .populate('community', 'name');

    res.json({
      success: true,
      message: alreadyLiked ? 'Post unliked' : 'Post liked',
      data: updatedPost
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating like'
    });
  }
});

// @desc    Add comment to post
// @route   POST /api/posts/:postId/comment
// @access  Private
router.post('/:postId/comment', authMiddleware, async (req, res) => { // ✅ ADD AUTH
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const authorId = req.user.id; // ✅ USE AUTHENTICATED USER

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    post.comments.push({
      author: authorId,
      content
    });

    await post.save();

      // Create notification for the post author (if commenter isn't the author)
      try {
        const postAuthorId = post.author.toString();
        if (postAuthorId !== authorId) {
          await Notification.create({
            recipient: postAuthorId,
            type: 'comment',
            actor: authorId,
            post: postId,
            message: `New comment on your post.`
          });
        }
      } catch (notifErr) {
        console.error('Notification error (comment):', notifErr.message);
      }

    const updatedPost = await Post.findById(postId)
      .populate('author', 'username profile')
      .populate('community', 'name')
      .populate('comments.author', 'username profile');

    res.json({
      success: true,
      message: 'Comment added successfully',
      data: updatedPost
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding comment'
    });
  }
});

// @desc    Save/unsave a post for current user
// @route   POST /api/posts/:postId/save
// @access  Private
router.post('/:postId/save', authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;
    const memberId = req.user.id;

    const Member = require('../models/member');
    const member = await Member.findById(memberId);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

    const alreadySaved = member.savedPosts?.some(id => id.toString() === postId);

    if (alreadySaved) {
      member.savedPosts = member.savedPosts.filter(id => id.toString() !== postId);
    } else {
      member.savedPosts = member.savedPosts || [];
      member.savedPosts.push(postId);
    }

    await member.save();

    res.json({ success: true, message: alreadySaved ? 'Post removed from saved' : 'Post saved', data: { savedPosts: member.savedPosts } });
  } catch (error) {
    console.error('Save post error:', error);
    res.status(500).json({ success: false, message: 'Error saving post' });
  }
});

module.exports = router;
