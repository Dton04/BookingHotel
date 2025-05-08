// booking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  roomid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'rooms',
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
  paymentStatus: { // Lưu trạng thái thanh toán
    type: String,
    enum: ['pending', 'paid', 'canceled'],
    default: 'pending',
  },
  paymentDeadline: { // Thời gian hết hạn thanh toán
    type: Date,
    default: null,
  },
  cancelReason: { 
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  momoOrderId: { // Lưu orderId từ MoMo
    type: String,
    default: null,
  },
  momoRequestId: { // Lưu requestId từ MoMo
    type: String,
    default: null,
  },
  momoTransactionId: { // Lưu transactionId từ MoMo (sau khi thanh toán thành công)
    type: String,
    default: null,
  },
});

module.exports = mongoose.model('Booking', bookingSchema);