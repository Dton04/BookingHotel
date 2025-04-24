const express = require('express');
const router = express.Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const { protect, admin, staff } = require('../middleware/auth');

// Middleware kiểm tra admin hoặc staff
const adminOrStaff = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'staff')) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as admin or staff' });
  }
};

/**
 * @route   POST /api/users/register
 * @desc    Đăng ký người dùng mới
 * @access  Công khai (không yêu cầu xác thực)
 * @input   { name: String, email: String, password: String, isAdmin: Boolean (tùy chọn), role: String (tùy chọn, 'user'|'admin'|'staff'), phone: String (tùy chọn, tối đa 10 ký tự) }
 * @output  { _id, name, email, isAdmin, role, phone } hoặc { message: lỗi }
 * @example Postman: POST http://localhost:5000/api/users/register
 *          Body: { "name": "John Doe", "email": "john@example.com", "password": "123456", "phone": "0123456789" }
 */
router.post('/register', async (req, res) => {
  const { name, email, password, isAdmin, role, phone } = req.body;

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
      phone,
    });

    const savedUser = await user.save();

    res.status(201).json({
      _id: savedUser._id,
      name: savedUser.name,
      email: savedUser.email,
      isAdmin: savedUser.isAdmin,
      role: savedUser.role,
      phone: savedUser.phone,
    });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(400).json({ message: error.message });
  }
});

/**
 * @route   POST /api/users/login
 * @desc    Đăng nhập và nhận JWT token
 * @access  Công khai (không yêu cầu xác thực)
 * @input   { email: String, password: String }
 * @output  { _id, name, email, isAdmin, role, phone, token } hoặc { message: lỗi }
 * @example Postman: POST http://localhost:5000/api/users/login
 *          Body: { "email": "john@example.com", "password": "123456" }
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail, password });
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
      phone: user.phone,
      token,
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(400).json({ message: error.message });
  }
});

/**
 * @route   GET /api/users/profile
 * @desc    Lấy hồ sơ người dùng hiện tại
 * @access  Riêng tư (yêu cầu token, tất cả vai trò: user, staff, admin)
 * @input   Header: Authorization: Bearer <token>
 * @output  { _id, name, email, isAdmin, role, phone } hoặc { message: lỗi }
 * @example Postman: GET http://localhost:5000/api/users/profile
 *          Headers: { "Authorization": "Bearer <token>" }
 */
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Profile error:', error.message);
    res.status(400).json({ message: error.message });
  }
});

/**
 * @route   GET /api/users/allusers
 * @desc    Lấy danh sách tất cả người dùng có role 'user' (chưa bị xóa mềm)
 * @access  Riêng tư (yêu cầu token, chỉ admin hoặc staff)
 * @input   Header: Authorization: Bearer <token>
 * @output  [{ _id, name, email, role, phone }, ...] hoặc { message: lỗi }
 * @example Postman: GET http://localhost:5000/api/users/allusers
 *          Headers: { "Authorization": "Bearer <token>" }
 */
router.get('/allusers', protect, adminOrStaff, async (req, res) => {
  try {
    const users = await User.find({ role: 'user', isDelete: false }).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   PUT /api/users/:userId
 * @desc    Cập nhật thông tin người dùng
 * @access  Riêng tư (yêu cầu token, chỉ admin)
 * @input   Header: Authorization: Bearer <token>
 *          Body: { name: String (tùy chọn), email: String (tùy chọn), password: String (tùy chọn), isAdmin: Boolean (tùy chọn), role: String (tùy chọn), phone: String (tùy chọn) }
 * @output  { _id, name, email, isAdmin, role, phone } hoặc { message: lỗi }
 * @example Postman: PUT http://localhost:5000/api/users/<userId>
 *          Headers: { "Authorization": "Bearer <token>" }
 *          Body: { "name": "John Updated", "phone": "0987654321" }
 */
router.put('/:userId', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email ? req.body.email.toLowerCase() : user.email;
      user.password = req.body.password || user.password;
      user.isAdmin = req.body.isAdmin !== undefined ? req.body.isAdmin : user.isAdmin;
      user.role = req.body.role || user.role;
      user.phone = req.body.phone || user.phone;

      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
        role: updatedUser.role,
        phone: updatedUser.phone,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Update user error:', error.message);
    res.status(400).json({ message: error.message });
  }
});

/**
 * @route   POST /api/users/staff
 * @desc    Tạo nhân viên mới (role: 'staff')
 * @access  Riêng tư (yêu cầu token, chỉ admin)
 * @input   Header: Authorization: Bearer <token>
 *          Body: { name: String, email: String, password: String, phone: String (tùy chọn) }
 * @output  { _id, name, email, role, phone } hoặc { message: lỗi }
 * @example Postman: POST http://localhost:5000/api/users/staff
 *          Headers: { "Authorization": "Bearer <token>" }
 *          Body: { "name": "Staff One", "email": "staff@example.com", "password": "123456", "phone": "0123456789" }
 */
router.post('/staff', protect, admin, async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

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
      phone,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    });
  } catch (error) {
    console.error('Create staff error:', error.message);
    res.status(400).json({ message: error.message });
  }
});

/**
 * @route   GET /api/users/staff
 * @desc    Lấy danh sách nhân viên (role: 'staff', chưa bị xóa mềm)
 * @access  Riêng tư (yêu cầu token, chỉ admin)
 * @input   Header: Authorization: Bearer <token>
 * @output  [{ _id, name, email, role, phone }, ...] hoặc { message: lỗi }
 * @example Postman: GET http://localhost:5000/api/users/staff
 *          Headers: { "Authorization": "Bearer <token>" }
 */
router.get('/staff', protect, admin, async (req, res) => {
  try {
    const staffMembers = await User.find({ role: 'staff', isDelete: false }).select('-password');
    res.json(staffMembers);
  } catch (error) {
    console.error('Get staff error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   PUT /api/users/staff/:id
 * @desc    Cập nhật thông tin nhân viên
 * @access  Riêng tư (yêu cầu token, chỉ admin)
 * @input   Header: Authorization: Bearer <token>
 *          Body: { name: String (tùy chọn), email: String (tùy chọn), password: String (tùy chọn), phone: String (tùy chọn) }
 * @output  { _id, name, email, role, phone } hoặc { message: lỗi }
 * @example Postman: PUT http://localhost:5000/api/users/staff/<staffId>
 *          Headers: { "Authorization": "Bearer <token>" }
 *          Body: { "name": "Staff Updated", "phone": "0987654321" }
 */
router.put('/staff/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user && user.role === 'staff') {
      user.name = req.body.name || user.name;
      user.email = req.body.email ? req.body.email.toLowerCase() : user.email;
      user.password = req.body.password || user.password;
      user.phone = req.body.phone || user.phone;

      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
      });
    } else {
      res.status(404).json({ message: 'Staff member not found' });
    }
  } catch (error) {
    console.error('Update staff error:', error.message);
    res.status(400).json({ message: error.message });
  }
});

/**
 * @route   DELETE /api/users/staff/:id
 * @desc    Xóa mềm người dùng hoặc nhân viên (đặt isDelete = true)
 * @access  Riêng tư (yêu cầu token, chỉ admin hoặc staff, không xóa admin)
 * @input   Header: Authorization: Bearer <token>
 * @output  { message: 'User marked as deleted' } hoặc { message: lỗi }
 * @example Postman: DELETE http://localhost:5000/api/users/staff/<userId>
 *          Headers: { "Authorization": "Bearer <token>" }
 */
router.delete('/staff/:id', protect, adminOrStaff, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin user' });
    }
    user.isDelete = true;
    await user.save();
    res.json({ message: 'User marked as deleted' });
  } catch (error) {
    console.error('Delete user error:', error.message);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;