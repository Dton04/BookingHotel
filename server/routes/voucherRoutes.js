const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Voucher = require('../models/voucher');
const Room = require('../models/room');
const { protect, admin } = require('../middleware/auth');
const { route } = require('./usersRoutes');

// POST /api/vouchers/hotel-specific - Tạo khuyến mãi riêng cho từng khách sạn
router.post('/hotel-specific', protect, admin, async (req, res) => {
  try {
    const { code, description, discountType, discountValue, applicableHotels, startDate, endDate, minBookingAmount, maxDiscount, isStackable } = req.body;

    // Kiểm tra xem các phòng có tồn tại không
    const rooms = await Room.find({ _id: { $in: applicableHotels } });
    if (rooms.length !== applicableHotels.length) {
      return res.status(400).json({ message: 'Một hoặc nhiều phòng không tồn tại' });
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
    console.error('Lỗi khi tạo khuyến mãi:', error.message);
    res.status(500).json({ message: 'Lỗi khi tạo khuyến mãi', error: error.message });
  }
});

// PUT /api/vouchers/override - Cập nhật khuyến mãi chồng ưu đãi
router.put('/override', protect, admin, async (req, res) => {
   const { voucherId, isStackable } = req.body;
 
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
 
     voucher.isStackable = isStackable !== undefined ? isStackable : voucher.isStackable;
     const updatedVoucher = await voucher.save();
 
     res.status(200).json({ message: 'Cập nhật khuyến mãi thành công', voucher: updatedVoucher });
   } catch (error) {
     console.error('Lỗi khi cập nhật khuyến mãi:', error.message, XAI.stack);
     res.status(500).json({ message: 'Lỗi khi cập nhật khuyến mãi', error: error.message });
   }
 });
 
 // POST /api/vouchers/apply-promotions - Áp dụng khuyến mãi khi đặt phòng
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
