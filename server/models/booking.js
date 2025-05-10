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
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: props => `${props.value} không phải là email hợp lệ!`
    },
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
    min: 1,
  },
  children: {
    type: Number,
    required: false,
    default: 0,
    min: 0,
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
    default: null, // Thời gian hết hạn thanh toán
  },
  cancelReason: {
    type: String,
    default: null, // Lý do hủy đặt phòng
  },
  voucherDiscount: {
    type: Number,
    default: 0, // Tổng số tiền giảm giá từ voucher
  },
  appliedVouchers: [{
    code: String,
    discount: Number, // Danh sách voucher đã áp dụng
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  momoOrderId: {
    type: String,
    default: null, // Lưu orderId từ MoMo
  },
  momoRequestId: {
    type: String,
    default: null, // Lưu requestId từ MoMo
  },
  momoTransactionId: {
    type: String,
    default: null, // Lưu transactionId từ MoMo (sau khi thanh toán thành công)
  },
});

// Thêm index
bookingSchema.index({ roomid: 1, paymentStatus: 1 });
bookingSchema.index({ email: 1, paymentStatus: 1 });
bookingSchema.index({ roomid: 1, email: 1, paymentStatus: 1 });

module.exports = mongoose.model('Booking', bookingSchema);