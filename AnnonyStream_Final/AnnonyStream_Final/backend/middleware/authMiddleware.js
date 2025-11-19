const jwt = require('jsonwebtoken');
const Member = require('../models/member'); // ✅ Change back to member.js

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token, authorization denied'
      });
    }

    try {
      // ✅ DECODE the JWT to get the user ID
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: decoded.id }; // Use the ID from the decoded token
      next();
    } catch (error) {
      console.error('JWT verification error:', error);
      res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

module.exports = authMiddleware;