// roomController.js
const mongoose = require('mongoose');
const Room = require("../models/room");
const Booking = require("../models/booking");
const Hotel = require("../models/hotel");
const fs = require('fs');
const path = require('path');

// GET /api/rooms/getallrooms - Lấy tất cả phòng
exports.getAllRooms = async (req, res) => {
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
};

// POST /api/rooms/getroombyid - Lấy phòng theo ID
exports.getRoomById = async (req, res) => {
  const { roomid } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (!mongoose.Types.ObjectId.isValid(roomid)) {
      return res.status(400).json({ message: "ID phòng không hợp lệ" });
    }

    const room = await Room.findById(roomid);

    if (room) {
      res.send(room);
    } else {
      res.status(404).json({ message: "Không tìm thấy phòng" });
    }
  } catch (error) {
    console.error("Lỗi khi lấy thông tin phòng:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi lấy thông tin phòng", error: error.message });
  }
};

// POST /api/rooms - Tạo phòng mới (chỉ admin)
exports.createRoom = async (req, res) => {
  const {
    name,
    maxcount,
    beds,
    baths,
    phonenumber,
    rentperday,
    imageurls = [],
    currentbookings = [],
    availabilityStatus = 'available',
    type,
    description,
    hotelId, 
  } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (!name || !maxcount || !beds || !baths || !phonenumber || !rentperday || !type || !description || !hotelId) {
      return res.status(400).json({ message: "Vui lòng cung cấp đầy đủ các trường bắt buộc: name, maxcount, beds, baths, phonenumber, rentperday, type, description, hotelId" });
    }

    if (isNaN(maxcount) || isNaN(beds) || isNaN(baths) || isNaN(phonenumber) || isNaN(rentperday)) {
      return res.status(400).json({ message: "maxcount, beds, baths, phonenumber, rentperday phải là số" });
    }

    if (!["available", "maintenance", "busy"].includes(availabilityStatus)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ. Phải là: available, maintenance, hoặc busy" });
    }

    if (!mongoose.Types.ObjectId.isValid(hotelId)) {
      return res.status(400).json({ message: "ID khách sạn không hợp lệ" });
    }

    // Kiểm tra khách sạn tồn tại
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: "Không tìm thấy khách sạn" });
    }

    const newRoom = new Room({
      name,
      maxcount: Number(maxcount),
      beds: Number(beds),
      baths: Number(baths),
      phonenumber: Number(phonenumber),
      rentperday: Number(rentperday),
      imageurls,
      currentbookings,
      availabilityStatus,
      type,
      description,
    });

    const savedRoom = await newRoom.save();

    // Thêm phòng mới vào mảng rooms của khách sạn
    hotel.rooms.push(savedRoom._id);
    await hotel.save();

    res.status(201).json({
      message: "Tạo phòng thành công",
      room: savedRoom
    });
  } catch (error) {
    console.error("Lỗi khi tạo phòng:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi tạo phòng", error: error.message });
  }
};

// BE4.20 PATCH /api/rooms/:id/price - Cập nhật giá phòng
exports.updateRoomPrice = async (req, res) => {
  const { id } = req.params;
  const { rentperday } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID phòng không hợp lệ" });
    }

    if (!rentperday || isNaN(rentperday) || Number(rentperday) <= 0) {
      return res.status(400).json({ message: "Giá phòng phải là số dương" });
    }

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }

    room.rentperday = Number(rentperday);
    const updatedRoom = await room.save();

    res.status(200).json({ message: "Cập nhật giá phòng thành công", room: updatedRoom });
  } catch (error) {
    console.error("Lỗi khi cập nhật giá phòng:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi cập nhật giá phòng", error: error.message });
  }
};

// BE4.21 POST /api/rooms/:id/images - Tải ảnh phòng
exports.uploadRoomImages = async (req, res) => {
  const { id } = req.params;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID phòng không hợp lệ" });
    }

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Vui lòng cung cấp ít nhất một ảnh" });
    }

    const newImages = req.files.map(file => `${req.protocol}://${req.get('host')}/Uploads/${file.filename}`);
    room.imageurls = [...room.imageurls, ...newImages];
    const updatedRoom = await room.save();

    res.status(201).json({ message: "Tải ảnh phòng thành công", room: updatedRoom });
  } catch (error) {
    console.error("Lỗi khi tải ảnh phòng:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi tải ảnh phòng", error: error.message });
  }
};

// BE4.22 DELETE /api/rooms/:id/images/:imgId - Xóa ảnh phòng
exports.deleteRoomImage = async (req, res) => {
  const { id, imgId } = req.params;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID phòng không hợp lệ" });
    }

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }

    const imageIndex = room.imageurls.findIndex(url => url.includes(imgId));
    if (imageIndex === -1) {
      return res.status(404).json({ message: "Không tìm thấy ảnh" });
    }

    const imageUrl = room.imageurls[imageIndex];
    const filePath = path.join(__dirname, '../', imageUrl.replace(`${req.protocol}://${req.get('host')}`, ''));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    room.imageurls.splice(imageIndex, 1);
    const updatedRoom = await room.save();

    res.status(200).json({ message: "Xóa ảnh phòng thành công", room: updatedRoom });
  } catch (error) {
    console.error("Lỗi khi xóa ảnh phòng:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi xóa ảnh phòng", error: error.message });
  }
};

// BE4.23 GET /api/rooms/images/:id - Lấy danh sách ảnh của phòng
exports.getRoomImages = async (req, res) => {
  const { id } = req.params;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID phòng không hợp lệ" });
    }

    const room = await Room.findById(id).select('imageurls');
    if (!room) {
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }

    res.status(200).json({ images: room.imageurls });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách ảnh phòng:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi lấy danh sách ảnh phòng", error: error.message });
  }
};