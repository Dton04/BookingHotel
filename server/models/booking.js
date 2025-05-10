const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  roomid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  checkin: {
    type: Date,
    required: true,
  },
  checkout: {
    type: Date,
    required: true,
  },
  adults: {
    type: Number,
    required: true,
  },
  children: {
    type: Number,
    required: false,
  },
  roomType: {
    type: String,
    required: true,
  },
  specialRequest: {
    type: String,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'canceled'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit_card', 'bank_transfer', 'mobile_payment'],
    default: null,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'canceled'],
    default: 'pending',
  },
  paymentDeadline: {
    type: Date,
    default: null,
  },
  cancelReason: {
    type: String,
    default: null,
  },
  voucherDiscount: {
    type: Number,
    default: 0,
    // Tổng số tiền giảm giá từ voucher
  },
  appliedVouchers: [{
    code: String,
    discount: Number,
    // Danh sách voucher đã áp dụng
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Booking', bookingSchema);