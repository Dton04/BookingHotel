const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Middleware kiểm tra token
const protect = async (req, res, next) => {
  let token;

  // Kiểm tra header Authorization
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      // Xác thực token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // Tìm user trong database
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      next();
    } catch (error) {
      // Xử lý lỗi cụ thể
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Not authorized, token expired' });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Not authorized, invalid token' });
      }
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

// Middleware chỉ cho admin
const admin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized, user not found' });
  }
  if (req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

// Middleware chỉ cho staff
const staff = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized, user not found' });
  }
  if (req.user.role === 'staff') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as staff' });
  }
};

module.exports = { protect, admin, staff };