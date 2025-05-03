const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Booking = require('../models/booking');
const Review = require('../models/review');
const jwt = require('jsonwebtoken');
const { protect, admin, staff } = require('../middleware/auth');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Tạo thư mục uploads nếu chưa tồn tại
const uploadDir = path.join(__dirname, '../uploads');
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
 * @route   PUT /api/users/profile
 * @desc    Cập nhật hồ sơ người dùng hiện tại
 * @access  Riêng tư (yêu cầu token, tất cả vai trò: user, staff, admin)
 */
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

    // Xử lý upload ảnh
    if (req.file) {
      // Xóa ảnh cũ nếu tồn tại
      if (user.avatar && fs.existsSync(path.join(__dirname, '../', user.avatar))) {
        fs.unlinkSync(path.join(__dirname, '../', user.avatar));
      }
      updates.avatar = `/Uploads/${req.file.filename}`;
    }

    // Xử lý thay đổi mật khẩu
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

    // Trả về URL đầy đủ cho ảnh
    const avatarUrl = updates.avatar
      ? `${req.protocol}://${req.get('host')}${updates.avatar}`
      : user.avatar;

    res.json({ ...updatedUser._doc, bookingsCount, avatar: avatarUrl });
  } catch (error) {
    console.error('Update profile error:', error.message);
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
});


/**
 * @route   POST /api/users/register
 * @desc    Đăng ký người dùng mới
 * @access  Công khai (không yêu cầu xác thực)
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
      password, // Lưu mật khẩu dạng plain text
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
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail, password }); // So sánh trực tiếp
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
 */
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Sử dụng email để đếm số lượng đặt phòng
    const bookingsCount = await Booking.countDocuments({ email: user.email.toLowerCase() });
    res.json({ ...user._doc, bookingsCount });
  } catch (error) {
    console.error('Profile error:', error.message);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

/**
 * @route   PUT /api/users/profile
 * @desc    Cập nhật hồ sơ người dùng hiện tại
 * @access  Riêng tư (yêu cầu token, tất cả vai trò: user, staff, admin)
 */
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
      updates.avatar = `/uploads/${req.file.filename}`;
    }

    // Xử lý thay đổi mật khẩu
    if (req.body.oldPassword && req.body.newPassword) {
      // So sánh mật khẩu cũ trực tiếp
      if (req.body.oldPassword !== user.password) {
        return res.status(400).json({ message: 'Mật khẩu cũ không đúng' });
      }
      updates.password = req.body.newPassword; // Lưu mật khẩu mới dạng plain text
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
    const bookingsCount = await Booking.countDocuments({ email: user.email.toLowerCase() });
    res.json({ ...updatedUser._doc, bookingsCount });
  } catch (error) {
    console.error('Update profile error:', error.message);
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
});

/**
 * @route   GET /api/users/allusers
 * @desc    Lấy danh sách tất cả người dùng có role 'user' (chưa bị xóa mềm)
 * @access  Riêng tư (yêu cầu token, chỉ admin hoặc staff)
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
      password, // Lưu mật khẩu dạng plain text
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



// ... (Các import và code hiện tại trong usersRoutes.js)

const Notification = require('../models/notification'); // Giả định model Notification

/**
 * @route   GET /api/users/:id/bookings
 * @desc    Lấy danh sách đặt phòng của một người dùng
 * @access  Riêng tư (yêu cầu token, chỉ admin/staff hoặc chính người dùng)
 */
router.get('/:id/bookings', protect, async (req, res) => {
  try {
    const userId = req.params.id;
    const requestingUser = req.user;

    // Kiểm tra quyền: chỉ admin/staff hoặc chính người dùng được truy cập
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

/**
 * @route   PUT /api/users/:id/profile
 * @desc    Cập nhật thông tin cá nhân của một người dùng
 * @access  Riêng tư (yêu cầu token, chỉ admin hoặc chính người dùng)
 */
router.put('/:id/profile', protect, async (req, res) => {
  try {
    const userId = req.params.id;
    const requestingUser = req.user;

    // Kiểm tra quyền: chỉ admin hoặc chính người dùng được cập nhật
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

/**
 * @route   PUT /api/users/:id/password
 * @desc    Đổi mật khẩu của một người dùng
 * @access  Riêng tư (yêu cầu token, chỉ chính người dùng)
 */
router.put('/:id/password', protect, async (req, res) => {
  try {
    const userId = req.params.id;
    const { oldPassword, newPassword } = req.body;

    // Kiểm tra quyền: chỉ chính người dùng được đổi mật khẩu
    if (req.user.id !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // So sánh mật khẩu cũ
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

/**
 * @route   GET /api/users/:id/reviews
 * @desc    Lấy danh sách đánh giá của một người dùng
 * @access  Riêng tư (yêu cầu token, chỉ admin/staff hoặc chính người dùng)
 */
router.get('/:id/reviews', protect, async (req, res) => {
  try {
    const userId = req.params.id;
    const requestingUser = req.user;

    // Kiểm tra quyền: chỉ admin/staff hoặc chính người dùng được truy cập
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

/**
 * @route   GET /api/users/stats
 * @desc    Thống kê người dùng theo khu vực hoặc thời gian
 * @access  Riêng tư (yêu cầu token, chỉ admin)
 */
router.get('/stats', protect, admin, async (req, res) => {
  try {
    const { startDate, endDate, region } = req.query;

    let query = { isDelete: false };

    // Lọc theo thời gian
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Lọc theo khu vực (giả định trường `region` trong User)
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

/**
 * @route   POST /api/users/ban
 * @desc    Khóa tài khoản người dùng vi phạm
 * @access  Riêng tư (yêu cầu token, chỉ admin)
 */
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

    user.isDelete = true; // Khóa tài khoản bằng soft delete
    user.banReason = reason; // Giả định có trường banReason trong schema
    await user.save();

    res.json({ message: 'User banned successfully', banReason: reason });
  } catch (error) {
    console.error('Ban user error:', error.message);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

/**
 * @route   PATCH /api/users/:id/role
 * @desc    Cập nhật quyền của người dùng (user/admin/staff)
 * @access  Riêng tư (yêu cầu token, chỉ admin)
 */
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

/**
 * @route   GET /api/users/recent
 * @desc    Lấy danh sách người dùng mới đăng ký
 * @access  Riêng tư (yêu cầu token, chỉ admin/staff)
 */
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

/**
 * @route   GET /api/users/frequent
 * @desc    Lấy danh sách người dùng đặt phòng thường xuyên
 * @access  Riêng tư (yêu cầu token, chỉ admin/staff)
 */
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

/**
 * @route   GET /api/users/search?q=...
 * @desc    Tìm kiếm người dùng theo tên hoặc email
 * @access  Riêng tư (yêu cầu token, chỉ admin/staff)
 */
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

/**
 * @route   GET /api/users/:id/notifications
 * @desc    Lấy danh sách thông báo của một người dùng
 * @access  Riêng tư (yêu cầu token, chỉ admin/staff hoặc chính người dùng)
 */
router.get('/:id/notifications', protect, async (req, res) => {
  try {
    const userId = req.params.id;
    const requestingUser = req.user;

    // Kiểm tra quyền: chỉ admin/staff hoặc chính người dùng được truy cập
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

/**
 * @route   POST /api/users/:id/notifications
 * @desc    Gửi thông báo cá nhân tới một người dùng
 * @access  Riêng tư (yêu cầu token, chỉ admin/staff)
 */
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
      type: type || 'info', // Loại thông báo: info, warning, error, ...
    });

    await notification.save();
    res.status(201).json({ message: 'Notification sent successfully', notification });
  } catch (error) {
    console.error('Send notification error:', error.message);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

module.exports = router;