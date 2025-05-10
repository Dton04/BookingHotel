const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
  },
  userName: {
    type: String,
    required: false,
    default: 'Ẩn danh',
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
  email: {
    type: String,
    required: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Review', reviewSchema);