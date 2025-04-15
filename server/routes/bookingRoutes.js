const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Booking = require("../models/booking");

router.post("/bookroom", async (req, res) => {
  const {
    roomid,
    name,
    email,
    phone,
    checkin,
    checkout,
    adults,
    children,
    roomType,
    specialRequest,
  } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (!mongoose.Types.ObjectId.isValid(roomid)) {
      return res.status(400).json({ message: "ID phòng không hợp lệ" });
    }

    if (!name || !email || !phone || !checkin || !checkout || !adults || !children || !roomType) {
      return res.status(400).json({ message: "Thiếu các trường bắt buộc" });
    }

    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);
    if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime())) {
      return res.status(400).json({ message: "Ngày nhận phòng hoặc trả phòng không hợp lệ" });
    }

    const newBooking = new Booking({
      roomid,
      name,
      email,
      phone,
      checkin: checkinDate,
      checkout: checkoutDate,
      adults: Number(adults),
      children: Number(children),
      roomType,
      specialRequest,
    });

    await newBooking.save();
    res.status(201).json({ message: "Đặt phòng thành công", booking: newBooking });
  } catch (error) {
    console.error("Lỗi trong API đặt phòng:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi đặt phòng", error: error.message });
  }
});

// GET /api/bookings/check?email=...&roomId=...
router.get("/check", async (req, res) => {
  const { email, roomId } = req.query;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (!email || !roomId) {
      return res.status(400).json({ message: "Email và roomId là bắt buộc" });
    }

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: "roomId không hợp lệ" });
    }

    const booking = await Booking.findOne({ email, roomid: roomId });
    if (!booking) {
      return res.status(404).json({ hasBooked: false, message: "Không tìm thấy đặt phòng với email và roomId này" });
    }

    res.status(200).json({ hasBooked: true, booking });
  } catch (error) {
    console.error("Lỗi khi kiểm tra đặt phòng:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi kiểm tra đặt phòng", error: error.message });
  }
});

// GET /api/bookings/:id - Lấy chi tiết 1 lượt đặt phòng
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID đặt phòng không hợp lệ" });
    }

    const booking = await Booking.findById(id).populate("roomid");
    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đặt phòng với ID này" });
    }

    res.status(200).json(booking);
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết đặt phòng:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi lấy chi tiết đặt phòng", error: error.message });
  }
});

// PUT /api/bookings/:id/cancel - Hủy đặt phòng
router.put("/:id/cancel", async (req, res) => {
  const { id } = req.params;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID đặt phòng không hợp lệ" });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đặt phòng với ID này" });
    }

    if (booking.status === "canceled") {
      return res.status(400).json({ message: "Đặt phòng này đã bị hủy trước đó" });
    }

    booking.status = "canceled";
    await booking.save();

    res.status(200).json({ message: "Hủy đặt phòng thành công", booking });
  } catch (error) {
    console.error("Lỗi khi hủy đặt phòng:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi hủy đặt phòng", error: error.message });
  }
});

// PUT /api/bookings/:id/confirm - Xác nhận đã thanh toán
router.put("/:id/confirm", async (req, res) => {
  const { id } = req.params;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID đặt phòng không hợp lệ" });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đặt phòng với ID này" });
    }

    if (booking.status === "confirmed") {
      return res.status(400).json({ message: "Đặt phòng này đã được xác nhận trước đó" });
    }

    if (booking.status === "canceled") {
      return res.status(400).json({ message: "Không thể xác nhận một đặt phòng đã bị hủy" });
    }

    booking.status = "confirmed";
    await booking.save();

    res.status(200).json({ message: "Xác nhận đặt phòng thành công", booking });
  } catch (error) {
    console.error("Lỗi khi xác nhận đặt phòng:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi xác nhận đặt phòng", error: error.message });
  }
});

// GET /api/bookings?status=... - Lọc đặt phòng theo trạng thái
router.get("/", async (req, res) => {
  const { status } = req.query;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (status && !["pending", "confirmed", "canceled"].includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ. Phải là: pending, confirmed, hoặc canceled" });
    }

    const query = status ? { status } : {};
    const bookings = await Booking.find(query).populate("roomid");

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đặt phòng:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi lấy danh sách đặt phòng", error: error.message });
  }
});

module.exports = router;