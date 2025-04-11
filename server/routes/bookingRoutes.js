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

    // Tạo booking mới
    const newBooking = new Booking({
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
    });

    // Lưu booking vào database
    await newBooking.save();

    res.status(201).json({ message: 'Booking successful', booking: newBooking });
  } catch (error) {
    res.status(500).json({ message: 'Error booking room', error });
  }
});

module.exports = router;