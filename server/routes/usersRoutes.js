const express = require('express');
const router = express.Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const { protect, admin, staff } = require('../middleware/auth');

// Đăng ký người dùng (POST /api/users/register)
router.post('/register', async (req, res) => {
  const { name, email, password, isAdmin, role } = req.body;

  try {
    const normalizedEmail = email.toLowerCase();
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = new User({
      name,
      email: normalizedEmail,
      password,
      isAdmin: isAdmin || false,
      role: role || 'user',
    });

    const savedUser = await user.save();

    res.status(201).json({
      _id: savedUser._id,
      name: savedUser.name,
      email: savedUser.email,
      isAdmin: savedUser.isAdmin,
      role: savedUser.role,
    });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(400).json({ message: error.message });
  }
});

// Đăng nhập (POST /api/users/login)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log('Login request:', { email, password });
    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail, password });
    console.log('Found user:', user);
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(400).json({ message: error.message });
  }
});

// Lấy hồ sơ người dùng (GET /api/users/profile)
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Middleware để kiểm tra admin hoặc staff (dùng cho route mà cả admin và staff đều truy cập được)
const adminOrStaff = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'staff')) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as admin or staff' });
  }
};

// Lấy danh sách tất cả người dùng có role "user" (GET /api/users/allusers)
router.get('/allusers', protect, adminOrStaff, async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Cập nhật người dùng (PUT /api/users/:userId)
router.put('/:userId', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email ? req.body.email.toLowerCase() : user.email;
      user.password = req.body.password || user.password;
      user.isAdmin = req.body.isAdmin !== undefined ? req.body.isAdmin : user.isAdmin;
      user.role = req.body.role || user.role;

      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
        role: updatedUser.role,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Update user error:', error.message);
    res.status(400).json({ message: error.message });
  }
});

// Tạo nhân viên (POST /api/users/staff)
router.post('/staff', protect, admin, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const normalizedEmail = email.toLowerCase();
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      isAdmin: false,
      role: 'staff',
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error('Create staff error:', error.message);
    res.status(400).json({ message: error.message });
  }
});

// Lấy danh sách nhân viên (GET /api/users/staff)
router.get('/staff', protect, admin, async (req, res) => {
  try {
    const staffMembers = await User.find({ role: 'staff' }).select('-password');
    res.json(staffMembers);
  } catch (error) {
    console.error('Get staff error:', error.message);
    res.status(400).json({ message: error.message });
  }
});

// Cập nhật nhân viên (PUT /api/users/staff/:id)
router.put('/staff/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user && user.role === 'staff') {
      user.name = req.body.name || user.name;
      user.email = req.body.email ? req.body.email.toLowerCase() : user.email;
      user.password = req.body.password || user.password;

      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      });
    } else {
      res.status(404).json({ message: 'Staff member not found' });
    }
  } catch (error) {
    console.error('Update staff error:', error.message);
    res.status(400).json({ message: error.message });
  }
});

// Xóa user (DELETE /api/users/staff/:id)
router.delete('/staff/:id', protect, adminOrStaff, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin user' });
    }
    await user.deleteOne();
    res.json({ message: 'User removed' });
  } catch (error) {
    console.error('Delete user error:', error.message);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;