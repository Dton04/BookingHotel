const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Promotion = require('../models/promotion');
const Voucher = require('../models/voucher');
const Room = require('../models/room');
const User = require('../models/user');
const Transaction = require('../models/transaction');
const { protect, admin } = require('../middleware/auth');

/**
 * @route   POST /api/promotions/festival
 * @desc    Tạo khuyến mãi dịp lễ
 * @access  Riêng tư (yêu cầu token, chỉ admin)
 */
router.post('/festival', protect, admin, async (req, res) => {
  const {
    name,
    description,
    discountType,
    discountValue,
    applicableHotels,
    startDate,
    endDate,
    minBookingAmount,
    maxDiscount,
    isStackable,
  } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    if (!['percentage', 'fixed'].includes(discountType)) {
      return res.status(400).json({ message: 'Loại giảm giá không hợp lệ' });
    }

    if (applicableHotels && applicableHotels.length > 0) {
      const rooms = await Room.find({ _id: { $in: applicableHotels } });
      if (rooms.length !== applicableHotels.length) {
        return res.status(400).json({ message: 'Một hoặc nhiều phòng không tồn tại' });
      }
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return res.status(400).json({ message: 'Ngày bắt đầu hoặc kết thúc không hợp lệ' });
    }

    const promotion = new Promotion({
      name,
      description,
      type: 'festival',
      discountType,
      discountValue,
      applicableHotels: applicableHotels || [],
      startDate,
      endDate,
      minBookingAmount: minBookingAmount || 0,
      maxDiscount,
      isStackable: isStackable || false,
    });

    await promotion.save();
    res.status(201).json({ message: 'Tạo khuyến mãi dịp lễ thành công', promotion });
  } catch (error) {
    console.error('Lỗi khi tạo khuyến mãi dịp lễ:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi tạo khuyến mãi dịp lễ', error: error.message });
  }
});

/**
 * @route   POST /api/promotions/voucher
 * @desc    Tạo khuyến mãi voucher
 * @access  Riêng tư (yêu cầu token, chỉ admin)
 */
router.post('/voucher', protect, admin, async (req, res) => {
  const {
    name,
    description,
    discountType,
    discountValue,
    applicableHotels,
    startDate,
    endDate,
    minBookingAmount,
    maxDiscount,
    isStackable,
    voucherCode,
  } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    if (!['percentage', 'fixed'].includes(discountType)) {
      return res.status(400).json({ message: 'Loại giảm giá không hợp lệ' });
    }

    if (!voucherCode) {
      return res.status(400).json({ message: 'Mã voucher là bắt buộc' });
    }

    const voucherExists = await Voucher.findOne({ code: voucherCode });
    if (!voucherExists) {
      return res.status(404).json({ message: 'Không tìm thấy voucher với mã này' });
    }

    if (applicableHotels && applicableHotels.length > 0) {
      const rooms = await Room.find({ _id: { $in: applicableHotels } });
      if (rooms.length !== applicableHotels.length) {
        return res.status(400).json({ message: 'Một hoặc nhiều phòng không tồn tại' });
      }
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return res.status(400).json({ message: 'Ngày bắt đầu hoặc kết thúc không hợp lệ' });
    }

    const promotion = new Promotion({
      name,
      description,
      type: 'voucher',
      discountType,
      discountValue,
      applicableHotels: applicableHotels || [],
      startDate,
      endDate,
      minBookingAmount: minBookingAmount || 0,
      maxDiscount,
      isStackable: isStackable || false,
      voucherCode,
    });

    await promotion.save();
    res.status(201).json({ message: 'Tạo khuyến mãi voucher thành công', promotion });
  } catch (error) {
    console.error('Lỗi khi tạo khuyến mãi voucher:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi tạo khuyến mãi voucher', error: error.message });
  }
});

/**
 * @route   PUT /api/promotions/:id
 * @desc    Cập nhật khuyến mãi
 * @access  Riêng tư (yêu cầu token, chỉ admin)
 */
router.put('/:id', protect, admin, async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    discountType,
    discountValue,
    applicableHotels,
    startDate,
    endDate,
    minBookingAmount,
    maxDiscount,
    isStackable,
    voucherCode,
    membershipLevel,
    minSpending,
  } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID khuyến mãi không hợp lệ' });
    }

    const promotion = await Promotion.findById(id);
    if (!promotion) {
      return res.status(404).json({ message: 'Không tìm thấy khuyến mãi' });
    }

    if (discountType && !['percentage', 'fixed'].includes(discountType)) {
      return res.status(400).json({ message: 'Loại giảm giá không hợp lệ' });
    }

    if (applicableHotels && applicableHotels.length > 0) {
      const rooms = await Room.find({ _id: { $in: applicableHotels } });
      if (rooms.length !== applicableHotels.length) {
        return res.status(400).json({ message: 'Một hoặc nhiều phòng không tồn tại' });
      }
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
        return res.status(400).json({ message: 'Ngày bắt đầu hoặc kết thúc không hợp lệ' });
      }
    }

    if (voucherCode && promotion.type === 'voucher') {
      const voucherExists = await Voucher.findOne({ code: voucherCode });
      if (!voucherExists) {
        return res.status(404).json({ message: 'Không tìm thấy voucher với mã này' });
      }
    }

    if (membershipLevel && !['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'].includes(membershipLevel)) {
      return res.status(400).json({ message: 'Cấp độ thành viên không hợp lệ' });
    }

    promotion.name = name || promotion.name;
    promotion.description = description || promotion.description;
    promotion.discountType = discountType || promotion.discountType;
    promotion.discountValue = discountValue !== undefined ? discountValue : promotion.discountValue;
    promotion.applicableHotels = applicableHotels || promotion.applicableHotels;
    promotion.startDate = startDate || promotion.startDate;
    promotion.endDate = endDate || promotion.endDate;
    promotion.minBookingAmount = minBookingAmount !== undefined ? minBookingAmount : promotion.minBookingAmount;
    promotion.maxDiscount = maxDiscount !== undefined ? maxDiscount : promotion.maxDiscount;
    promotion.isStackable = isStackable !== undefined ? isStackable : promotion.isStackable;
    promotion.voucherCode = voucherCode || promotion.voucherCode;
    promotion.membershipLevel = membershipLevel || promotion.membershipLevel;
    promotion.minSpending = minSpending !== undefined ? minSpending : promotion.minSpending;

    const updatedPromotion = await promotion.save();
    res.status(200).json({ message: 'Cập nhật khuyến mãi thành công', promotion: updatedPromotion });
  } catch (error) {
    console.error('Lỗi khi cập nhật khuyến mãi:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi cập nhật khuyến mãi', error: error.message });
  }
});

/**
 * @route   DELETE /api/promotions/:id
 * @desc    Xóa khuyến mãi (soft delete)
 * @access  Riêng tư (yêu cầu token, chỉ admin)
 */
router.delete('/:id', protect, admin, async (req, res) => {
  const { id } = req.params;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID khuyến mãi không hợp lệ' });
    }

    const promotion = await Promotion.findById(id);
    if (!promotion) {
      return res.status(404).json({ message: 'Không tìm thấy khuyến mãi' });
    }

    promotion.isDeleted = true;
    await promotion.save();
    res.status(200).json({ message: 'Xóa khuyến mãi thành công' });
  } catch (error) {
    console.error('Lỗi khi xóa khuyến mãi:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi xóa khuyến mãi', error: error.message });
  }
});

/**
 * @route   GET /api/promotions/member
 * @desc    Lấy danh sách khuyến mãi theo cấp độ thành viên
 * @access  Riêng tư (yêu cầu token)
 */
router.get('/member', protect, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    const user = await User.findById(req.user.id).select('points');
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    let membershipLevel;
    if (user.points >= 1000000) {
      membershipLevel = 'Diamond';
    } else if (user.points >= 500000) {
      membershipLevel = 'Platinum';
    } else if (user.points >= 100000) {
      membershipLevel = 'Gold';
    } else if (user.points >= 50000) {
      membershipLevel = 'Silver';
    } else {
      membershipLevel = 'Bronze';
    }

    const now = new Date();
    const promotions = await Promotion.find({
      type: 'member',
      membershipLevel,
      isDeleted: false,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).populate('applicableHotels', 'name');

    res.status(200).json({
      membershipLevel,
      promotions,
    });
  } catch (error) {
    console.error('Lỗi khi lấy khuyến mãi theo cấp độ thành viên:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi lấy khuyến mãi theo cấp độ thành viên', error: error.message });
  }
});

/**
 * @route   GET /api/promotions/accumulated
 * @desc    Lấy khuyến mãi dựa trên số tiền chi tiêu tích lũy
 * @access  Riêng tư (yêu cầu token)
 */
router.get('/accumulated', protect, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    const transactions = await Transaction.find({ userId: req.user.id, status: 'completed' });
    const totalSpending = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);

    const now = new Date();
    const promotions = await Promotion.find({
      type: 'accumulated',
      minSpending: { $lte: totalSpending },
      isDeleted: false,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).populate('applicableHotels', 'name');

    res.status(200).json({
      totalSpending,
      promotions,
    });
  } catch (error) {
    console.error('Lỗi khi lấy khuyến mãi theo chi tiêu tích lũy:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi lấy khuyến mãi theo chi tiêu tích lũy', error: error.message });
  }
});

/**
 * @route   POST /api/promotions/stack-check
 * @desc    Kiểm tra và tính toán khả năng chồng các khuyến mãi
 * @access  Công khai
 */
router.post('/stack-check', async (req, res) => {
  const { bookingData, promotionIds } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    if (!bookingData || !bookingData.roomid || !bookingData.checkin || !bookingData.checkout || !promotionIds || !Array.isArray(promotionIds)) {
      return res.status(400).json({ message: 'Dữ liệu đặt phòng hoặc danh sách khuyến mãi không hợp lệ' });
    }

    if (!mongoose.Types.ObjectId.isValid(bookingData.roomid)) {
      return res.status(400).json({ message: 'ID phòng không hợp lệ' });
    }

    const room = await Room.findById(bookingData.roomid);
    if (!room) {
      return res.status(404).json({ message: 'Không tìm thấy phòng' });
    }

    const checkinDate = new Date(bookingData.checkin);
    const checkoutDate = new Date(bookingData.checkout);
    if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime()) || checkinDate >= checkoutDate) {
      return res.status(400).json({ message: 'Ngày nhận phòng hoặc trả phòng không hợp lệ' });
    }

    const days = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
    let totalAmount = room.rentperday * days;

    const promotions = await Promotion.find({
      _id: { $in: promotionIds },
      isDeleted: false,
    });

    if (!promotions.length) {
      return res.status(404).json({ message: 'Không tìm thấy khuyến mãi hợp lệ' });
    }

    let totalDiscount = 0;
    const appliedPromotions = [];

    for (const promotion of promotions) {
      const now = new Date();
      if (now < promotion.startDate || now > promotion.endDate) {
        continue;
      }

      if (promotion.applicableHotels.length > 0 && !promotion.applicableHotels.some(id => id.equals(bookingData.roomid))) {
        continue;
      }

      if (totalAmount < promotion.minBookingAmount) {
        continue;
      }

      if (promotion.type === 'member' && bookingData.userId) {
        const user = await User.findById(bookingData.userId).select('points');
        if (!user) continue;

        let membershipLevel;
        if (user.points >= 1000000) membershipLevel = 'Diamond';
        else if (user.points >= 500000) membershipLevel = 'Platinum';
        else if (user.points >= 100000) membershipLevel = 'Gold';
        else if (user.points >= 50000) membershipLevel = 'Silver';
        else membershipLevel = 'Bronze';

        if (promotion.membershipLevel && promotion.membershipLevel !== membershipLevel) {
          continue;
        }
      }

      if (promotion.type === 'accumulated' && bookingData.userId) {
        const transactions = await Transaction.find({ userId: bookingData.userId, status: 'completed' });
        const totalSpending = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
        if (promotion.minSpending && totalSpending < promotion.minSpending) {
          continue;
        }
      }

      let discount = 0;
      if (promotion.discountType === 'percentage') {
        discount = (totalAmount * promotion.discountValue) / 100;
        if (promotion.maxDiscount && discount > promotion.maxDiscount) {
          discount = promotion.maxDiscount;
        }
      } else {
        discount = promotion.discountValue;
      }

      if (!promotion.isStackable && appliedPromotions.length > 0) {
        continue;
      }

      totalDiscount += discount;
      appliedPromotions.push({
        promotionId: promotion._id,
        name: promotion.name,
        discount,
      });
    }

    totalAmount = Math.max(0, totalAmount - totalDiscount);

    res.status(200).json({
      message: 'Kiểm tra chồng khuyến mãi thành công',
      totalAmount,
      appliedPromotions,
    });
  } catch (error) {
    console.error('Lỗi khi kiểm tra chồng khuyến mãi:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi kiểm tra chồng khuyến mãi', error: error.message });
  }
});

module.exports = router;