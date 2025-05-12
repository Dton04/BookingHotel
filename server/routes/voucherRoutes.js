const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Voucher = require('../models/voucher');
const Room = require('../models/room');
const { protect, admin } = require('../middleware/auth');

/**
 * @route   GET /api/vouchers/admin
 * @desc    Lấy tất cả voucher (bao gồm đã hết hạn) cho admin
 * @access  Riêng tư (yêu cầu token, chỉ admin)
 */
router.get('/admin', protect, admin, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    const vouchers = await Voucher.find().populate('applicableHotels', 'name');
    // Lọc bỏ các applicableHotels không hợp lệ (null hoặc không tồn tại)
    const cleanedVouchers = vouchers.map((voucher) => {
      const validHotels = voucher.applicableHotels.filter((hotel) => hotel !== null && hotel.name);
      return {
        ...voucher._doc,
        applicableHotels: validHotels,
      };
    });

    res.status(200).json(cleanedVouchers);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách voucher:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách voucher', error: error.message });
  }
});

/**
 * @route   GET /api/vouchers/check-code/:code
 * @desc    Kiểm tra mã voucher có tồn tại không
 * @access  Riêng tư (yêu cầu token, chỉ admin)
 */
router.get('/check-code/:code', protect, admin, async (req, res) => {
  try {
    const voucher = await Voucher.findOne({ code: req.params.code });
    res.status(200).json({ exists: !!voucher });
  } catch (error) {
    console.error('Lỗi khi kiểm tra mã voucher:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi kiểm tra mã voucher', error: error.message });
  }
});

/**
 * @route   POST /api/vouchers/hotel-specific
 * @desc    Tạo voucher cho khách sạn cụ thể
 * @access  Riêng tư (yêu cầu token, chỉ admin)
 */
router.post('/hotel-specific', protect, admin, async (req, res) => {
  try {
    const { code, description, discountType, discountValue, applicableHotels, startDate, endDate, minBookingAmount, maxDiscount, isStackable } = req.body;

    if (!['percentage', 'fixed'].includes(discountType)) {
      return res.status(400).json({ message: 'Loại giảm giá không hợp lệ' });
    }

    if (!applicableHotels || applicableHotels.length === 0) {
      return res.status(400).json({ message: 'Phải chọn ít nhất một khách sạn' });
    }

    const rooms = await Room.find({ _id: { $in: applicableHotels } });
    if (rooms.length !== applicableHotels.length) {
      return res.status(400).json({ message: 'Một hoặc nhiều phòng không tồn tại' });
    }

    const voucherExists = await Voucher.findOne({ code });
    if (voucherExists) {
      return res.status(400).json({ message: 'Mã voucher đã tồn tại' });
    }

    const voucher = new Voucher({
      code,
      description,
      discountType,
      discountValue,
      applicableHotels,
      startDate,
      endDate,
      minBookingAmount,
      maxDiscount,
      isStackable,
    });

    await voucher.save();
    res.status(201).json(voucher);
  } catch (error) {
    console.error('Lỗi khi tạo khuyến mãi:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi tạo khuyến mãi', error: error.message });
  }
});

/**
 * @route   PUT /api/vouchers/override
 * @desc    Cập nhật toàn bộ thông tin voucher
 * @access  Riêng tư (yêu cầu token, chỉ admin)
 */
router.put('/override', protect, admin, async (req, res) => {
  const { voucherId, code, description, discountType, discountValue, applicableHotels, startDate, endDate, minBookingAmount, maxDiscount, isStackable } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    if (!mongoose.Types.ObjectId.isValid(voucherId)) {
      return res.status(400).json({ message: 'ID khuyến mãi không hợp lệ' });
    }

    const voucher = await Voucher.findById(voucherId);
    if (!voucher) {
      return res.status(404).json({ message: 'Không tìm thấy khuyến mãi' });
    }

    if (applicableHotels && applicableHotels.length > 0) {
      const rooms = await Room.find({ _id: { $in: applicableHotels } });
      if (rooms.length !== applicableHotels.length) {
        return res.status(400).json({ message: 'Một hoặc nhiều phòng không tồn tại' });
      }
    }

    voucher.code = code || voucher.code;
    voucher.description = description || voucher.description;
    voucher.discountType = discountType || voucher.discountType;
    voucher.discountValue = discountValue !== undefined ? discountValue : voucher.discountValue;
    voucher.applicableHotels = applicableHotels || voucher.applicableHotels;
    voucher.startDate = startDate || voucher.startDate;
    voucher.endDate = endDate || voucher.endDate;
    voucher.minBookingAmount = minBookingAmount !== undefined ? minBookingAmount : voucher.minBookingAmount;
    voucher.maxDiscount = maxDiscount !== undefined ? maxDiscount : voucher.maxDiscount;
    voucher.isStackable = isStackable !== undefined ? isStackable : voucher.isStackable;

    const updatedVoucher = await voucher.save();
    res.status(200).json({ message: 'Cập nhật khuyến mãi thành công', voucher: updatedVoucher });
  } catch (error) {
    console.error('Lỗi khi cập nhật khuyến mãi:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi cập nhật khuyến mãi', error: error.message });
  }
});

/**
 * @route   DELETE /api/vouchers/:id
 * @desc    Xóa voucher
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

    const voucher = await Voucher.findById(id);
    if (!voucher) {
      return res.status(404).json({ message: 'Không tìm thấy khuyến mãi' });
    }

    await Voucher.deleteOne({ _id: id });
    res.status(200).json({ message: 'Xóa khuyến mãi thành công' });
  } catch (error) {
    console.error('Lỗi khi xóa khuyến mãi:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi xóa khuyến mãi', error: error.message });
  }
});

/**
 * @route   POST /api/vouchers/apply-promotions
 * @desc    Áp dụng các mã khuyến mãi cho đặt phòng
 * @access  Công khai
 */
router.post('/apply-promotions', async (req, res) => {
  const { bookingData, voucherCodes } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    if (!bookingData || !bookingData.roomid || !voucherCodes || !Array.isArray(voucherCodes)) {
      return res.status(400).json({ message: 'Dữ liệu đặt phòng hoặc mã khuyến mãi không hợp lệ' });
    }

    const room = await Room.findById(bookingData.roomid);
    if (!room) {
      return res.status(404).json({ message: 'Không tìm thấy phòng' });
    }

    const checkinDate = new Date(bookingData.checkin);
    const checkoutDate = new Date(bookingData.checkout);
    const days = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
    let totalAmount = room.rentperday * days;

    const vouchers = await Voucher.find({ code: { $in: voucherCodes } });
    if (!vouchers.length) {
      return res.status(404).json({ message: 'Không tìm thấy mã khuyến mãi hợp lệ' });
    }

    let totalDiscount = 0;
    const appliedVouchers = [];

    for (const voucher of vouchers) {
      const now = new Date();
      if (now < voucher.startDate || now > voucher.endDate) {
        continue;
      }

      if (!voucher.applicableHotels.includes(bookingData.roomid)) {
        continue;
      }

      if (totalAmount < voucher.minBookingAmount) {
        continue;
      }

      let discount = 0;
      if (voucher.discountType === 'percentage') {
        discount = (totalAmount * voucher.discountValue) / 100;
        if (voucher.maxDiscount && discount > voucher.maxDiscount) {
          discount = voucher.maxDiscount;
        }
      } else {
        discount = voucher.discountValue;
      }

      if (!voucher.isStackable && appliedVouchers.length > 0) {
        continue;
      }

      totalDiscount += discount;
      appliedVouchers.push({
        code: voucher.code,
        discount,
      });
    }

   

    totalAmount = Math.max(0, totalAmount - totalDiscount);

    res.status(200).json({
      message: 'Áp dụng khuyến mãi thành công',
      totalAmount,
      appliedVouchers,
    });
  } catch (error) {
    console.error('Lỗi khi áp dụng khuyến mãi:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi áp dụng khuyến mãi', error: error.message });
  }
});

module.exports = router;