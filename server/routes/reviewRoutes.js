// routes/reviewRoutes.js (phiên bản cuối cùng)
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Review = require("../models/review");
const Booking = require("../models/booking");

// GET /api/reviews?roomId=...
router.get("/", async (req, res) => {
  const { roomId } = req.query;

  try {
    if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: "ID phòng không hợp lệ hoặc thiếu" });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    const reviews = await Review.find({ roomId });
    res.status(200).json(reviews);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đánh giá:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi lấy danh sách đánh giá", error: error.message });
  }
});

// GET /api/reviews/average?roomId=...
router.get("/average", async (req, res) => {
  const { roomId } = req.query;

  try {
    if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: "ID phòng không hợp lệ hoặc thiếu" });
    }

    const reviews = await Review.find({ roomId });
    const totalReviews = reviews.length;
    const average = totalReviews > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews : 0;

    res.status(200).json({ average, totalReviews });
  } catch (error) {
    console.error("Lỗi khi tính điểm trung bình:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi tính điểm trung bình", error: error.message });
  }
});

// GET /api/reviews/by-email?email=...
router.get("/by-email", async (req, res) => {
  const { email } = req.query;

  try {
    if (!email || email.trim() === "") {
      return res.status(400).json({ message: "Email là bắt buộc" });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    const reviews = await Review.find({ email });
    res.status(200).json(reviews);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đánh giá theo email:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi lấy danh sách đánh giá theo email", error: error.message });
  }
});

// POST /api/reviews – Gửi đánh giá mới
router.post("/", async (req, res) => {
  const { roomId, userName, rating, comment, email } = req.body;

  try {
    if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: "ID phòng không hợp lệ hoặc thiếu" });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Điểm đánh giá phải từ 1 đến 5" });
    }

    if (!comment || comment.trim() === "") {
      return res.status(400).json({ message: "Bình luận là bắt buộc" });
    }

    if (!email || email.trim() === "") {
      return res.status(400).json({ message: "Email là bắt buộc để gửi đánh giá" });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    const booking = await Booking.findOne({ email, roomid: roomId });
    if (!booking) {
      return res.status(403).json({ message: "Bạn phải đặt phòng này để gửi đánh giá" });
    }

    const existingReview = await Review.findOne({ roomId, email });
    if (existingReview) {
      return res.status(403).json({ message: "Bạn đã gửi đánh giá cho phòng này rồi" });
    }

    const newReview = new Review({
      roomId,
      userName: userName || "Ẩn danh",
      rating,
      comment,
      email,
    });

    await newReview.save();

    res.status(201).json({ message: "Gửi đánh giá thành công", review: newReview });
  } catch (error) {
    console.error("Lỗi khi gửi đánh giá:", {
      message: error.message,
      stack: error.stack,
      requestBody: req.body,
    });
    res.status(500).json({ message: "Lỗi khi gửi đánh giá", error: error.message });
  }
});

module.exports = router;