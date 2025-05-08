const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    // ID người dùng thực hiện giao dịch
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    // ID đặt phòng liên quan
  },
  amount: {
    type: Number,
    required: true,
    // Số tiền giao dịch
  },
  pointsEarned: {
    type: Number,
    default: 0,
    // Điểm tích lũy từ giao dịch
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit_card', 'bank_transfer', 'mobile_payment'],
    required: true,
    // Phương thức thanh toán
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
    // Trạng thái giao dịch
  },
  createdAt: {
    type: Date,
    default: Date.now,
    // Thời gian tạo
  },
});

module.exports = mongoose.model('Transaction', transactionSchema);