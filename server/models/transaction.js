const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
  },
  amount: {
    type: Number,
    required: true, // Số tiền giao dịch (từ booking)
  },
  points: {
    type: Number,
    required: true, // Số điểm tích được
  },
  type: {
    type: String,
    enum: ['earn', 'redeem'],
    default: 'earn', // Loại giao dịch: tích điểm hoặc đổi điểm
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

transactionSchema.index({ userId: 1, bookingId: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);