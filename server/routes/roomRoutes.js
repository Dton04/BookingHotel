const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Room = require("../models/room");

router.get('/getallrooms', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    const rooms = await Room.find({});
    res.send(rooms);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách phòng:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi lấy danh sách phòng", error: error.message });
  }
});

router.post("/getroombyid", async (req, res) => {
  const { roomid } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (!mongoose.Types.ObjectId.isValid(roomid)) {
      return res.status(400).json({ message: "Invalid room ID" });
    }

    const room = await Room.findById(roomid);

    if (room) {
      res.send(room);
    } else {
      res.status(404).json({ message: "Room not found" });
    }
  } catch (error) {
    console.error("Lỗi khi lấy thông tin phòng:", error.message, error.stack);
    res.status(500).json({ message: "Error fetching room data", error: error.message });
  }
});

// POST /api/rooms/:id/availability - Đánh dấu phòng không khả dụng
router.post("/:id/availability", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // status: 'maintenance', 'busy', hoặc 'available'

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID phòng không hợp lệ" });
    }

    if (!["available", "maintenance", "busy"].includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ. Phải là: available, maintenance, hoặc busy" });
    }

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ message: "Không tìm thấy phòng với ID này" });
    }

    room.availabilityStatus = status;
    await room.save();

    res.status(200).json({ message: `Cập nhật trạng thái phòng thành ${status} thành công`, room });
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái phòng:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi cập nhật trạng thái phòng", error: error.message });
  }
});

// GET /api/rooms/available?checkin=...&checkout=... - Kiểm tra phòng còn trống
router.get("/available", async (req, res) => {
  const { checkin, checkout } = req.query;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (!checkin || !checkout) {
      return res.status(400).json({ message: "checkin và checkout là bắt buộc" });
    }

    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);
    if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime())) {
      return res.status(400).json({ message: "Ngày nhận phòng hoặc trả phòng không hợp lệ" });
    }

    if (checkinDate >= checkoutDate) {
      return res.status(400).json({ message: "Ngày nhận phòng phải trước ngày trả phòng" });
    }

    const rooms = await Room.find({
      availabilityStatus: 'available', // Chỉ lấy các phòng đang sẵn sàng
    });

    const availableRooms = rooms.filter(room => {
      return !room.currentbookings.some(booking => {
        const existingCheckin = new Date(booking.checkin);
        const existingCheckout = new Date(booking.checkout);
        return (
          (checkinDate >= existingCheckin && checkinDate < existingCheckout) ||
          (checkoutDate > existingCheckin && checkoutDate <= existingCheckout) ||
          (checkinDate <= existingCheckin && checkoutDate >= existingCheckout)
        );
      });
    });

    res.status(200).json(availableRooms);
  } catch (error) {
    console.error("Lỗi khi kiểm tra phòng còn trống:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi kiểm tra phòng còn trống", error: error.message });
  }
});

module.exports = router;