const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Check if model already exists to prevent OverwriteModelError
if (mongoose.models.Member) {
  module.exports = mongoose.models.Member;
} else {
  const memberSchema = new mongoose.Schema({
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    profile: {
      displayName: String,
      bio: {
        type: String,
        maxlength: 500
      },
      avatar: {
        type: String,
        default: ''
      }
    },
    joinedCommunities: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community'
    }],
    savedPosts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    }],
    isActive: {
      type: Boolean,
      default: true
    }
  }, {
    timestamps: true
  });

  // Hash password before saving
  memberSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    } catch (error) {
      next(error);
    }
  });

  // Compare password method
  memberSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  };

  // Remove password from JSON output
  memberSchema.methods.toJSON = function() {
    const member = this.toObject();
    delete member.password;
    return member;
  };

  module.exports = mongoose.model('Member', memberSchema);
}