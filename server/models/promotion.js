const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    // Tên chương trình khuyến mãi
  },
  description: {
    type: String,
    required: true,
    // Mô tả khuyến mãi
  },
  type: {
    type: String,
    enum: ['festival', 'voucher', 'member', 'accumulated'],
    required: true,
    // Loại khuyến mãi
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
    // Các phòng áp dụng khuyến mãi
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
  voucherCode: {
    type: String,
    default: null,
    // Mã voucher liên kết (nếu type là voucher)
  },
  membershipLevel: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', null],
    default: null,
    // Cấp độ thành viên yêu cầu (nếu type là member)
  },
  minSpending: {
    type: Number,
    default: null,
    // Số tiền chi tiêu tích lũy tối thiểu (nếu type là accumulated)
  },
  isDeleted: {
    type: Boolean,
    default: false,
    // Trạng thái xóa mềm
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Promotion', promotionSchema);