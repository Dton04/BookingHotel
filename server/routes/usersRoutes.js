const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/user');
const Booking = require('../models/booking');
const Review = require('../models/review');
const Transaction = require('../models/transaction');
const jwt = require('jsonwebtoken');
const { protect, admin, staff } = require('../middleware/auth');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Tạo thư mục uploads nếu chưa tồn tại
const uploadDir = path.join(__dirname, '../Uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình multer với kiểm tra định dạng và kích thước
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'Uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file JPEG, PNG hoặc GIF'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
});

// Middleware kiểm tra admin hoặc staff
const adminOrStaff = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'staff')) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as admin or staff' });
  }
};

/**
 * @route   GET /api/users/points
 * @desc    Lấy điểm tích lũy của người dùng hiện tại
 * @access  Riêng tư (yêu cầu token, tất cả vai trò: user, staff, admin)
 */
router.get('/points', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('points');
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Lấy lịch sử giao dịch liên quan đến điểm
    const transactions = await Transaction.find({ userId: req.user.id })
      .select('pointsEarned amount bookingId createdAt')
      .populate('bookingId', 'checkin checkout')
      .sort({ createdAt: -1 })
      .limit(10); // Giới hạn 10 giao dịch gần nhất

    res.status(200).json({
      points: user.points,
      recentTransactions: transactions,
    });
  } catch (error) {
    console.error('Lỗi lấy điểm tích lũy:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi lấy điểm tích lũy', error: error.message });
  }
});

/**
 * @route   GET /api/users/:id/points/history
 * @desc    Lấy lịch sử điểm tích lũy của một người dùng
 * @access  Riêng tư (yêu cầu token, chỉ admin/staff hoặc chính người dùng)
 */
router.get('/:id/points/history', protect, async (req, res) => {
  try {
    const userId = req.params.id;
    const requestingUser = req.user;

    // Kiểm tra quyền: chỉ admin/staff hoặc chính người dùng được truy cập
    if (requestingUser.id !== userId && !['admin', 'staff'].includes(requestingUser.role)) {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }

    const user = await User.findById(userId).select('points name email');
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Lấy lịch sử giao dịch liên quan đến điểm
    const transactions = await Transaction.find({ userId })
      .select('pointsEarned amount bookingId paymentMethod status createdAt')
      .populate('bookingId', 'checkin checkout roomid')
      .sort({ createdAt: -1 });

    res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        points: user.points,
      },
      transactions,
    });
  } catch (error) {
    console.error('Lỗi lấy lịch sử điểm:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi lấy lịch sử điểm', error: error.message });
  }
});

// Các endpoint khác giữ nguyên, chỉ liệt kê để đảm bảo không xung đột
router.put('/profile', protect, upload.single('avatar'), async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updates = {
      name: req.body.name || user.name,
      phone: req.body.phone || user.phone,
    };

    if (req.file) {
      if (user.avatar && fs.existsSync(path.join(__dirname, '../', user.avatar))) {
        fs.unlinkSync(path.join(__dirname, '../', user.avatar));
      }
      updates.avatar = `/Uploads/${req.file.filename}`;
    }

    if (req.body.oldPassword && req.body.newPassword) {
      if (req.body.oldPassword !== user.password) {
        return res.status(400).json({ message: 'Mật khẩu cũ không đúng' });
      }
      updates.password = req.body.newPassword;
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
    }).select('-password');
    const bookingsCount = await Booking.countDocuments({
      email: user.email.toLowerCase(),
    });

    const avatarUrl = updates.avatar
      ? `${req.protocol}://${req.get('host')}${updates.avatar}`
      : user.avatar;

    res.json({ ...updatedUser._doc, bookingsCount, avatar: avatarUrl });
  } catch (error) {
    console.error('Update profile error:', error.message);
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
});

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

router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const bookingsCount = await Booking.countDocuments({ email: user.email.toLowerCase() });
    res.json({ ...user._doc, bookingsCount });
  } catch (error) {
    console.error('Profile error:', error.message);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.get('/allusers', protect, adminOrStaff, async (req, res) => {
  try {
    const users = await User.find({ role: 'user', isDelete: false }).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

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

router.get('/staff', protect, admin, async (req, res) => {
  try {
    const staffMembers = await User.find({ role: 'staff', isDelete: false }).select('-password');
    res.json(staffMembers);
  } catch (error) {
    console.error('Get staff error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

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

const Notification = require('../models/notification');

router.get('/:id/bookings', protect, async (req, res) => {
  try {
    const userId = req.params.id;
    const requestingUser = req.user;

    if (requestingUser.id !== userId && !['admin', 'staff'].includes(requestingUser.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const bookings = await Booking.find({ email: user.email.toLowerCase() });
    res.json(bookings);
  } catch (error) {
    console.error('Get user bookings error:', error.message);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

router.put('/:id/profile', protect, async (req, res) => {
  try {
    const userId = req.params.id;
    const requestingUser = req.user;

    if (requestingUser.id !== userId && requestingUser.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updates = {
      name: req.body.name || user.name,
      phone: req.body.phone || user.phone,
    };

    const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-password');
    res.json(updatedUser);
  } catch (error) {
    console.error('Update user profile error:', error.message);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

router.put('/:id/password', protect, async (req, res) => {
  try {
    const userId = req.params.id;
    const { oldPassword, newPassword } = req.body;

    if (req.user.id !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (oldPassword !== user.password) {
      return res.status(400).json({ message: 'Mật khẩu cũ không đúng!' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    console.error('Change password error:', error.message);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

router.get('/:id/reviews', protect, async (req, res) => {
  try {
    const userId = req.params.id;
    const requestingUser = req.user;

    if (requestingUser.id !== userId && !['admin', 'staff'].includes(requestingUser.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const reviews = await Review.find({ email: user.email.toLowerCase() });
    res.json(reviews);
  } catch (error) {
    console.error('Get user reviews error:', error.message);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

router.get('/stats', protect, admin, async (req, res) => {
  try {
    const { startDate, endDate, region } = req.query;

    let query = { isDelete: false };

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (region) {
      query.region = region;
    }

    const stats = await User.aggregate([
      { $match: query },
      {
        $group: {
          _id: { role: '$role', region: '$region' },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json(stats);
  } catch (error) {
    console.error('Get user stats error:', error.message);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

router.post('/ban', protect, admin, async (req, res) => {
  try {
    const { userId, reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot ban admin user' });
    }

    user.isDelete = true;
    user.banReason = reason;
    await user.save();

    res.json({ message: 'User banned successfully', banReason: reason });
  } catch (error) {
    console.error('Ban user error:', error.message);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

router.patch('/:id/role', protect, admin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;

    if (!['user', 'admin', 'staff'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    user.isAdmin = role === 'admin';
    await user.save();

    res.json({ message: 'User role updated successfully', role });
  } catch (error) {
    console.error('Update user role error:', error.message);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

router.get('/recent', protect, adminOrStaff, async (req, res) => {
  try {
    const recentUsers = await User.find({ isDelete: false })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('-password');
    res.json(recentUsers);
  } catch (error) {
    console.error('Get recent users error:', error.message);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

router.get('/frequent', protect, adminOrStaff, async (req, res) => {
  try {
    const frequentUsers = await Booking.aggregate([
      {
        $group: {
          _id: '$email',
          bookingCount: { $sum: 1 },
        },
      },
      { $sort: { bookingCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'email',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: '$user._id',
          name: '$user.name',
          email: '$user.email',
          bookingCount: 1,
        },
      },
    ]);

    res.json(frequentUsers);
  } catch (error) {
    console.error('Get frequent users error:', error.message);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

router.get('/search', protect, adminOrStaff, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ],
      isDelete: false,
    }).select('-password');

    res.json(users);
  } catch (error) {
    console.error('Search users error:', error.message);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

router.get('/:id/notifications', protect, async (req, res) => {
  try {
    const userId = req.params.id;
    const requestingUser = req.user;

    if (requestingUser.id !== userId && !['admin', 'staff'].includes(requestingUser.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const notifications = await Notification.find({ userId });
    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error.message);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

router.post('/:id/notifications', protect, adminOrStaff, async (req, res) => {
  try {
    const userId = req.params.id;
    const { message, type } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const notification = new Notification({
      userId,
      message,
      type: type || 'info',
    });

    await notification.save();
    res.status(201).json({ message: 'Notification sent successfully', notification });
  } catch (error) {
    console.error('Send notification error:', error.message);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

router.post('/regions/assign-admin', protect, admin, async (req, res) => {
  const { userId, regionId } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(regionId)) {
      return res.status(400).json({ message: 'ID người dùng hoặc khu vực không hợp lệ' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    if (user.role !== 'admin') {
      return res.status(400).json({ message: 'Người dùng phải có vai trò admin' });
    }

    const region = await Region.findById(regionId);
    if (!region) {
      return res.status(404).json({ message: 'Không tìm thấy khu vực' });
    }

    region.adminId = userId;
    user.region = regionId;
    await region.save();
    await user.save();

    res.status(200).json({ message: 'Phân quyền admin khu vực thành công', region, user });
  } catch (error) {
    console.error('Lỗi phân quyền admin khu vực:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi phân quyền admin khu vực', error: error.message });
  }
});

module.exports = router;