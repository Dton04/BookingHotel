const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Booking = require("../models/booking");
const Review = require("../models/review");
const Room = require("../models/room");

// GET /api/dashboard/overview - Thống kê tổng quan
router.get("/overview", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    // Tổng số đặt phòng
    const totalBookings = await Booking.countDocuments();

    // Tổng số đánh giá
    const totalReviews = await Review.countDocuments();

    // Tổng doanh thu (tính từ các đặt phòng đã xác nhận)
    const confirmedBookings = await Booking.find({ status: "confirmed" }).populate("roomid");
    const totalRevenue = confirmedBookings.reduce((total, booking) => {
      if (!booking.roomid || !booking.roomid.rentperday) {
        return total;
      }

      const checkinDate = new Date(booking.checkin);
      const checkoutDate = new Date(booking.checkout);
      const days = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
      return total + (booking.roomid.rentperday * days);
    }, 0);

    res.status(200).json({
      totalBookings,
      totalReviews,
      totalRevenue,
    });
  } catch (error) {
    console.error("Lỗi khi lấy thống kê tổng quan:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi lấy thống kê tổng quan", error: error.message });
  }
});

module.exports = router;