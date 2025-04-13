// routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Booking = require('../models/booking');

router.post('/bookroom', async (req, res) => {
  const {
    roomid,
    name,
    email,
    phone,
    checkin,
    checkout,
    adults,
    children,
    roomType,
    specialRequest,
  } = req.body;

  try {
    // Kiểm tra roomid hợp lệ
    if (!mongoose.Types.ObjectId.isValid(roomid)) {
      return res.status(400).json({ message: 'Invalid room ID' });
    }

    // Kiểm tra các trường bắt buộc
    if (!name || !email || !phone || !checkin || !checkout || !adults || !children || !roomType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Kiểm tra định dạng ngày
    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);
    if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime())) {
      return res.status(400).json({ message: 'Invalid checkin or checkout date' });
    }

    // Tạo booking mới
    const newBooking = new Booking({
      roomid,
      name,
      email,
      phone,
      checkin: checkinDate,
      checkout: checkoutDate,
      adults: Number(adults),
      children: Number(children),
      roomType,
      specialRequest,
    });

    // Lưu booking vào database
    await newBooking.save();
    res.status(201).json({ message: 'Booking successful', booking: newBooking });
  } catch (error) {
    console.error('Error in bookroom API:', error.message, error.stack); // Log chi tiết lỗi
    res.status(500).json({ message: 'Error booking room', error: error.message });
  }
});

module.exports = router;