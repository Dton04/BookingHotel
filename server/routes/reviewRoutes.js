// routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Review = require('../models/review');
const Booking = require('../models/booking');

// GET /api/reviews?roomId=...
router.get('/', async (req, res) => {
  const { roomId } = req.query;

  try {
    // Kiểm tra roomId
    if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: 'ID phòng không hợp lệ hoặc thiếu' });
    }

    // Kiểm tra kết nối cơ sở dữ liệu
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    const reviews = await Review.find({ roomId });
    res.status(200).json(reviews);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách đánh giá:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách đánh giá', error: error.message });
  }
});

// POST /api/reviews – Gửi đánh giá mới
router.post('/', async (req, res) => {
  const { roomId, userName, rating, comment, email } = req.body;

  try {
    // Kiểm tra các trường bắt buộc
    if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: 'ID phòng không hợp lệ hoặc thiếu' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Điểm đánh giá phải từ 1 đến 5' });
    }

    if (!comment || comment.trim() === '') {
      return res.status(400).json({ message: 'Bình luận là bắt buộc' });
    }

    if (!email || email.trim() === '') {
      return res.status(400).json({ message: 'Email là bắt buộc để gửi đánh giá' });
    }

    // Kiểm tra kết nối cơ sở dữ liệu
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    // Kiểm tra xem người dùng đã đặt phòng chưa
    const booking = await Booking.findOne({ email, roomid: roomId });
    if (!booking) {
      return res.status(403).json({ message: 'Bạn phải đặt phòng này để gửi đánh giá' });
    }

    // Kiểm tra xem người dùng đã gửi đánh giá cho phòng này chưa
    const existingReview = await Review.findOne({ roomId, email });
    if (existingReview) {
      return res.status(403).json({ message: 'Bạn đã gửi đánh giá cho phòng này rồi' });
    }

    // Tạo đánh giá mới
    const newReview = new Review({
      roomId,
      userName: userName || 'Ẩn danh', // Dùng giá trị mặc định nếu không có userName
      rating,
      comment,
      email,
    });

    // Lưu đánh giá vào cơ sở dữ liệu
    await newReview.save();

    res.status(201).json({ message: 'Gửi đánh giá thành công', review: newReview });
  } catch (error) {
    console.error('Lỗi khi gửi đánh giá:', {
      message: error.message,
      stack: error.stack,
      requestBody: req.body, // Ghi log dữ liệu yêu cầu để gỡ lỗi
    });
    res.status(500).json({ message: 'Lỗi khi gửi đánh giá', error: error.message });
  }
});

module.exports = router;