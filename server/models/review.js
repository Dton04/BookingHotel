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
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: props => `${props.value} không phải là email hợp lệ!`
    },
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: false,
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

// Thêm index
reviewSchema.index({ roomId: 1, isDeleted: 1 });
reviewSchema.index({ email: 1, isDeleted: 1 });
reviewSchema.index({ roomId: 1, email: 1, isDeleted: 1 });

module.exports = mongoose.model('Review', reviewSchema);