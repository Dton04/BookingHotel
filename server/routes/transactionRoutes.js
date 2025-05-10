const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Transaction = require('../models/transaction');
const Booking = require('../models/booking');
const User = require('../models/user');
const { protect } = require('../middleware/auth');

/**
 * @route   POST /api/transactions/checkout
 * @desc    Tạo giao dịch mới để tích điểm
 * @access  Riêng tư (yêu cầu token, tất cả vai trò: user, staff, admin)
 */
router.post('/checkout', protect, async (req, res) => {
  const { bookingId, paymentMethod } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: 'ID đặt phòng không hợp lệ' });
    }

    if (!['cash', 'credit_card', 'bank_transfer', 'mobile_payment'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'Phương thức thanh toán không hợp lệ' });
    }

    const booking = await Booking.findById(bookingId).populate('roomid');
    if (!booking) {
      return res.status(404).json({ message: 'Không tìm thấy đặt phòng' });
    }

    if (booking.paymentStatus !== 'pending') {
      return res.status(400).json({ message: 'Đặt phòng đã được thanh toán hoặc bị hủy' });
    }

    const days = Math.ceil((new Date(booking.checkout) - new Date(booking.checkin)) / (1000 * 60 * 60 * 24));
    const originalAmount = booking.roomid.rentperday * days;
    const amount = Math.max(0, originalAmount - (booking.voucherDiscount || 0));

    if (amount <= 0) {
      return res.status(400).json({ message: 'Số tiền giao dịch không hợp lệ' });
    }

    // Tính điểm tích lũy (1% số tiền giao dịch)
    const pointsEarned = Math.floor(amount * 0.01);
    if (pointsEarned < 0) {
      return res.status(400).json({ message: 'Điểm tích lũy không hợp lệ' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const transaction = new Transaction({
        userId: req.user.id,
        bookingId,
        amount,
        pointsEarned,
        paymentMethod,
        status: 'completed',
      });

      await transaction.save({ session });

      // Cập nhật điểm tích lũy cho người dùng
      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { $inc: { points: pointsEarned } },
        { new: true, session }
      );

      // Cập nhật trạng thái thanh toán của booking
      booking.paymentStatus = 'paid';
      booking.status = 'confirmed';
      await booking.save({ session });

      await session.commitTransaction();

      console.log(`Giao dịch thành công: userId=${req.user.id}, bookingId=${bookingId}, pointsEarned=${pointsEarned}`);

      res.status(201).json({
        message: 'Giao dịch thành công',
        transaction,
        pointsEarned,
        totalPoints: updatedUser.points,
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Lỗi khi tạo giao dịch:', {
      userId: req.user.id,
      bookingId,
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Lỗi khi tạo giao dịch', error: error.message });
  }
});

/**
 * @route   GET /api/transactions
 * @desc    Lấy danh sách giao dịch của người dùng
 * @access  Riêng tư (yêu cầu token, tất cả vai trò: user, staff, admin)
 */
router.get('/', protect, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    const transactions = await Transaction.find({ userId: req.user.id })
      .populate('bookingId', 'checkin checkout roomid')
      .sort({ createdAt: -1 });

    res.status(200).json(transactions);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách giao dịch:', {
      userId: req.user.id,
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Lỗi khi lấy danh sách giao dịch', error: error.message });
  }
});

module.exports = router;