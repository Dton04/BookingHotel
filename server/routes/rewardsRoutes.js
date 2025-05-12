const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/user');
const Transaction = require('../models/transaction');
const Discount = require('../models/discount');
const { protect, admin } = require('../middleware/auth');

// Schema cho Reward
const rewardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    // Tên ưu đãi
  },
  description: {
    type: String,
    required: true,
    // Mô tả ưu đãi
  },
  membershipLevel: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'],
    required: true,
    // Cấp độ thành viên yêu cầu
  },
  pointsRequired: {
    type: Number,
    required: true,
    min: 0,
    // Số điểm cần để đổi ưu đãi
  },
  voucherCode: {
    type: String,
    required: true,
    unique: true,
    // Mã voucher liên kết với ưu đãi
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Reward = mongoose.model('Reward', rewardSchema);

/**
 * @route   POST /api/rewards
 * @desc    Thêm ưu đãi mới cho thành viên
 * @access  Riêng tư (yêu cầu token, chỉ admin)
 */
router.post('/', protect, admin, async (req, res) => {
  const { name, description, membershipLevel, pointsRequired, voucherCode } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    if (!['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'].includes(membershipLevel)) {
      return res.status(400).json({ message: 'Cấp độ thành viên không hợp lệ' });
    }

    const voucherExists = await Voucher.findOne({ code: voucherCode });
    if (!voucherExists) {
      return res.status(404).json({ message: 'Không tìm thấy voucher với mã này' });
    }

    const reward = new Reward({
      name,
      description,
      membershipLevel,
      pointsRequired,
      voucherCode,
    });

    await reward.save();
    res.status(201).json({ message: 'Tạo ưu đãi thành công', reward });
  } catch (error) {
    console.error('Lỗi khi tạo ưu đãi:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi tạo ưu đãi', error: error.message });
  }
});

/**
 * @route   PUT /api/rewards/:id
 * @desc    Sửa ưu đãi thành viên
 * @access  Riêng tư (yêu cầu token, chỉ admin)
 */
router.put('/:id', protect, admin, async (req, res) => {
  const { id } = req.params;
  const { name, description, membershipLevel, pointsRequired, voucherCode } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID ưu đãi không hợp lệ' });
    }

    const reward = await Reward.findById(id);
    if (!reward) {
      return res.status(404).json({ message: 'Không tìm thấy ưu đãi' });
    }

    if (membershipLevel && !['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'].includes(membershipLevel)) {
      return res.status(400).json({ message: 'Cấp độ thành viên không hợp lệ' });
    }

    if (voucherCode) {
      const voucherExists = await Voucher.findOne({ code: voucherCode });
      if (!voucherExists) {
        return res.status(404).json({ message: 'Không tìm thấy voucher với mã này' });
      }
    }

    reward.name = name || reward.name;
    reward.description = description || reward.description;
    reward.membershipLevel = membershipLevel || reward.membershipLevel;
    reward.pointsRequired = pointsRequired !== undefined ? pointsRequired : reward.pointsRequired;
    reward.voucherCode = voucherCode || reward.voucherCode;

    const updatedReward = await reward.save();
    res.status(200).json({ message: 'Cập nhật ưu đãi thành công', reward: updatedReward });
  } catch (error) {
    console.error('Lỗi khi cập nhật ưu đãi:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi cập nhật ưu đãi', error: error.message });
  }
});

/**
 * @route   DELETE /api/rewards/:id
 * @desc    Xóa ưu đãi thành viên
 * @access  Riêng tư (yêu cầu token, chỉ admin)
 */
router.delete('/:id', protect, admin, async (req, res) => {
  const { id } = req.params;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID ưu đãi không hợp lệ' });
    }

    const reward = await Reward.findById(id);
    if (!reward) {
      return res.status(404).json({ message: 'Không tìm thấy ưu đãi' });
    }

    await Reward.deleteOne({ _id: id });
    res.status(200).json({ message: 'Xóa ưu đãi thành công' });
  } catch (error) {
    console.error('Lỗi khi xóa ưu đãi:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi xóa ưu đãi', error: error.message });
  }
});

module.exports = router;