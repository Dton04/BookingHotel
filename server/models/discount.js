const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    // Tên chương trình khuyến mãi hoặc voucher
  },
  code: {
    type: String,
    unique: true,
    sparse: true, // Cho phép null nhưng vẫn đảm bảo tính duy nhất
    // Mã voucher (bắt buộc nếu type là voucher)
  },
  description: {
    type: String,
  },
  type: {
    type: String,
    enum: ['voucher', 'festival', 'member', 'accumulated'],
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
    // Số tiền đặt phòng tối thiểu
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
  membershipLevel: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', null],
    default: null,
    // Cấp độ thành viên (nếu type là member)
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
// Trong discount.js, thêm trường usedBy vào discountSchema
usedBy: [{
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  count: {
    type: Number,
    default: 0,
  },
}],

// Đảm bảo code là bắt buộc nếu type là voucher
discountSchema.pre('save', function (next) {
  if (this.type === 'voucher' && !this.code) {
    return next(new Error('Mã voucher là bắt buộc cho loại voucher'));
  }
  next();
});

module.exports = mongoose.model('Discount', discountSchema);