const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true,
    // Loại giảm giá: phần trăm hoặc cố định
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0,
    // Giá trị giảm giá
  },
  applicableHotels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    // Các khách sạn/phòng áp dụng khuyến mãi
  }],
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  minBookingAmount: {
    type: Number,
    default: 0,
    // Số tiền đặt phòng tối thiểu để áp dụng
  },
  maxDiscount: {
    type: Number,
    default: null,
    // Giảm giá tối đa (nếu có)
  },
  isStackable: {
    type: Boolean,
    default: false,
    // Cho phép chồng khuyến mãi
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Voucher', voucherSchema);