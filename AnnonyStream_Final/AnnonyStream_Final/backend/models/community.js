const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 50
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  guidelines: {
    type: String,
    maxlength: 1000
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member'
  }],
  tags: [String],
  avatar: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Add creator as first member
communitySchema.pre('save', function(next) {
  if (this.isNew) {
    this.members.push(this.creator);
  }
  next();
});

module.exports = mongoose.model('Community', communitySchema);