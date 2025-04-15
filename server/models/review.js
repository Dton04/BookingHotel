// models/review.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
  },
  userName: {
    type: String,
    required: false, // Cho phép tùy chọn
    default: 'Ẩn danh', // Mặc định là "Ẩn danh"
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: true,
  },
  email: { // Thêm trường email để kiểm tra trùng lặp
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Review', reviewSchema);