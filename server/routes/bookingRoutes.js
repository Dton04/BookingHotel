// bookingRoutes.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Booking = require("../models/booking");

router.post("/bookroom", async (req, res) => {
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
    if (!mongoose.Types.ObjectId.isValid(roomid)) {
      return res.status(400).json({ message: "ID phòng không hợp lệ" });
    }

    if (!name || !email || !phone || !checkin || !checkout || !adults || !children || !roomType) {
      return res.status(400).json({ message: "Thiếu các trường bắt buộc" });
    }

    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);
    if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime())) {
      return res.status(400).json({ message: "Ngày nhận phòng hoặc trả phòng không hợp lệ" });
    }

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

    await newBooking.save();
    res.status(201).json({ message: "Đặt phòng thành công", booking: newBooking });
  } catch (error) {
    console.error("Lỗi trong API đặt phòng:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi đặt phòng", error: error.message });
  }
});

// GET /api/bookings/check?email=...&roomId=...
router.get("/check", async (req, res) => {
  const { email, roomId } = req.query;

  try {
    if (!email || !roomId) {
      return res.status(400).json({ message: "Email và roomId là bắt buộc" });
    }

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: "roomId không hợp lệ" });
    }

    const booking = await Booking.findOne({ email, roomid: roomId });
    if (!booking) {
      return res.status(404).json({ hasBooked: false, message: "Không tìm thấy đặt phòng với email và roomId này" });
    }

    res.status(200).json({ hasBooked: true, booking });
  } catch (error) {
    console.error("Lỗi khi kiểm tra đặt phòng:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi kiểm tra đặt phòng", error: error.message });
  }
});

module.exports = router;