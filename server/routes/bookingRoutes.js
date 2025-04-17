const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Booking = require("../models/booking");
const Room = require("../models/room");

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

    const room = await Room.findById(roomid);
    if (!room) {
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }

    if (room.availabilityStatus !== 'available') {
      return res.status(400).json({ message: `Phòng đang ở trạng thái ${room.availabilityStatus}, không thể đặt` });
    }

    const isRoomBooked = room.currentbookings.some(booking => {
      const existingCheckin = new Date(booking.checkin);
      const existingCheckout = new Date(booking.checkout);
      return (
        (checkinDate >= existingCheckin && checkinDate < existingCheckout) ||
        (checkoutDate > existingCheckin && checkoutDate <= existingCheckout) ||
        (checkinDate <= existingCheckin && checkoutDate >= existingCheckout)
      );
    });

    if (isRoomBooked) {
      return res.status(400).json({ message: "Phòng đã được đặt trong khoảng thời gian này" });
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

    room.currentbookings.push({
      bookingId: newBooking._id,
      checkin: checkinDate,
      checkout: checkoutDate,
    });
    await room.save();

    res.status(201).json({ message: "Đặt phòng thành công", booking: newBooking });
  } catch (error) {
    console.error("Lỗi trong API đặt phòng:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi đặt phòng", error: error.message });
  }
});

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

    const room = await Room.findById(booking.roomid);
    if (room) {
      room.currentbookings = room.currentbookings.filter(
        (b) => b.bookingId.toString() !== id
      );
      await room.save();
    }

    res.status(200).json({ message: "Hủy đặt phòng thành công", booking });
  } catch (error) {
    console.error("Lỗi khi hủy đặt phòng:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi hủy đặt phòng", error: error.message });
  }
});

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

router.get("/", async (req, res) => {
  const { status, email } = req.query;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    const query = {};
    if (status && ["pending", "confirmed", "canceled"].includes(status)) {
      query.status = status;
    }
    if (email) {
      query.email = email;
    }

    const bookings = await Booking.find(query).populate("roomid");

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đặt phòng:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi lấy danh sách đặt phòng", error: error.message });
  }
});

module.exports = router;