const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Review = require("../models/review");
const Booking = require("../models/booking");
const { protect, admin, staff } = require('../middleware/auth');

// Middleware kiểm tra admin hoặc staff
const adminOrStaff = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'staff')) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as admin or staff' });
  }
};

// POST /api/reviews – Gửi đánh giá mới
router.post("/", async (req, res) => {
  const { roomId, userName, rating, comment, email } = req.body;

  try {
    console.log("Request body:", req.body);

    if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: "ID phòng không hợp lệ hoặc thiếu" });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Điểm đánh giá phải từ 1 đến 5" });
    }

    if (!comment || comment.trim() === "") {
      return res.status(400).json({ message: "Bình luận là bắt buộc" });
    }

    if (!email || email.trim() === "") {
      return res.status(400).json({ message: "Email là bắt buộc để gửi đánh giá" });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    console.log("Checking booking for email:", email, "and roomId:", roomId);
    const booking = await Booking.findOne({ email: email.toLowerCase(), roomid: roomId });
    if (!booking) {
      return res.status(403).json({ message: "Bạn phải đặt phòng này để gửi đánh giá" });
    }

    console.log("Checking existing review for roomId:", roomId, "and email:", email);
    const existingReview = await Review.findOne({ roomId, email: email.toLowerCase(), isDeleted: false });
    if (existingReview) {
      return res.status(403).json({ message: "Bạn đã gửi đánh giá cho phòng này rồi" });
    }

    const newReview = new Review({
      roomId,
      userName: userName || "Ẩn danh",
      rating,
      comment,
      email: email.toLowerCase(),
      isVisible: true, // Mặc định hiển thị khi tạo
    });

    console.log("Saving new review:", newReview);
    await newReview.save();

    res.status(201).json({ message: "Gửi đánh giá thành công", review: newReview });
  } catch (error) {
    console.error("Lỗi khi gửi đánh giá:", {
      message: error.message,
      stack: error.stack,
      requestBody: req.body,
    });
    res.status(500).json({ message: "Lỗi khi gửi đánh giá", error: error.message });
  }
});

// GET /api/reviews - Lấy danh sách tất cả đánh giá với bộ lọc và phân trang
router.get("/", async (req, res) => {
  const { roomId, email, status, page = 1, limit = 10, isVisible } = req.query;

  try {
    const query = {};

    if (roomId) {
      if (!mongoose.Types.ObjectId.isValid(roomId)) {
        return res.status(400).json({ message: "ID phòng không hợp lệ" });
      }
      query.roomId = roomId;
    }

    if (email) {
      query.email = email.toLowerCase();
    }

    if (status) {
      if (status === "active") {
        query.isDeleted = false;
      } else if (status === "deleted") {
        query.isDeleted = true;
      } else {
        return res.status(400).json({ message: "Trạng thái không hợp lệ, chỉ chấp nhận 'active' hoặc 'deleted'" });
      }
    } else {
      query.isDeleted = false; // Mặc định chỉ lấy các đánh giá chưa bị xóa
    }

    if (isVisible !== undefined) {
      query.isVisible = isVisible === 'true';
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);

    if (isNaN(parsedPage) || parsedPage < 1 || isNaN(parsedLimit) || parsedLimit < 1) {
      return res.status(400).json({ message: "Trang và giới hạn phải là số nguyên dương" });
    }

    const totalReviews = await Review.countDocuments(query);
    const reviews = await Review.find(query)
      .populate("roomId", "name type")
      .sort({ createdAt: -1 })
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit);

    res.status(200).json({
      reviews,
      totalReviews,
      totalPages: Math.ceil(totalReviews / parsedLimit),
      currentPage: parsedPage,
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đánh giá:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi lấy danh sách đánh giá", error: error.message });
  }
});

// GET /api/reviews/average?roomId=...
router.get("/average", async (req, res) => {
  const { roomId } = req.query;

  try {
    if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: "ID phòng không hợp lệ hoặc thiếu" });
    }

    const reviews = await Review.find({ roomId, isDeleted: false, isVisible: true });
    const totalReviews = reviews.length;
    const average = totalReviews > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews : 0;

    res.status(200).json({ average, totalReviews });
  } catch (error) {
    console.error("Lỗi khi tính điểm trung bình:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi tính điểm trung bình", error: error.message });
  }
});

// GET /api/reviews/by-email?email=...
router.get("/by-email", async (req, res) => {
  const { email } = req.query;

  try {
    if (!email || email.trim() === "") {
      return res.status(400).json({ message: "Email là bắt buộc" });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    const reviews = await Review.find({ email: email.toLowerCase(), isDeleted: false })
      .populate("roomId", "name type");
    res.status(200).json(reviews);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đánh giá theo email:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi lấy danh sách đánh giá theo email", error: error.message });
  }
});
// PATCH /api/reviews/:id/toggle-hidden - Ẩn/hiển thị đánh giá (chỉ admin hoặc staff)
router.patch("/:id/toggle-hidden", protect, adminOrStaff, async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID đánh giá không hợp lệ" });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: "Không tìm thấy đánh giá với ID này" });
    }

    if (review.isDeleted) {
      return res.status(400).json({ message: "Không thể thay đổi trạng thái ẩn của đánh giá đã bị xóa" });
    }

    review.isVisible = !review.isVisible;
    await review.save();

    const message = review.isHidden ? "Ẩn đánh giá thành công" : "Hiển thị đánh giá thành công";
    res.status(200).json({ message, review });
  } catch (error) {
    console.error("Lỗi khi thay đổi trạng thái ẩn của đánh giá:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi thay đổi trạng thái ẩn của đánh giá", error: error.message });
  }
});

// DELETE /api/reviews/:id - Xóa mềm đánh giá (chỉ admin hoặc staff)
router.delete("/:id", protect, adminOrStaff, async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID đánh giá không hợp lệ" });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: "Không tìm thấy đánh giá với ID này" });
    }

    if (review.isDeleted) {
      return res.status(400).json({ message: "Đánh giá này đã bị xóa trước đó" });
    }

    review.isDeleted = true;
    await review.save();

    res.status(200).json({ message: "Xóa mềm đánh giá thành công", review });
  } catch (error) {
    console.error("Lỗi khi xóa mềm đánh giá:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi xóa mềm đánh giá", error: error.message });
  }
});

// PATCH /api/reviews/:id/toggle-visibility - Bật/tắt hiển thị đánh giá
router.patch("/:id/toggle-visibility", protect, adminOrStaff, async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID đánh giá không hợp lệ" });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: "Không tìm thấy đánh giá" });
    }

    review.isVisible = !review.isVisible;
    await review.save();

    res.status(200).json({ message: "Cập nhật trạng thái hiển thị thành công", review });
  } catch (error) {
    console.error("Lỗi khi thay đổi trạng thái hiển thị:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi thay đổi trạng thái hiển thị", error: error.message });
  }
});

module.exports = router;