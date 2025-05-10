const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Hotel = require('../models/hotel');
const Room = require('../models/room');
const Region = require('../models/region');
const { protect, admin } = require('../middleware/auth');

// POST /api/hotels - Thêm khách sạn mới
router.post('/', protect, admin, async (req, res) => {
  const { name, address, region, contactNumber, email, description, rooms } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    if (!name || !address || !region || !contactNumber || !email) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ các trường bắt buộc: name, address, region, contactNumber, email' });
    }

    if (!mongoose.Types.ObjectId.isValid(region)) {
      return res.status(400).json({ message: 'ID khu vực không hợp lệ' });
    }

    const regionExists = await Region.findById(region);
    if (!regionExists) {
      return res.status(404).json({ message: 'Không tìm thấy khu vực' });
    }

    if (rooms && rooms.length > 0) {
      const validRooms = await Room.find({ _id: { $in: rooms } });
      if (validRooms.length !== rooms.length) {
        return res.status(400).json({ message: 'Một hoặc nhiều phòng không tồn tại' });
      }
    }

    const hotelExists = await Hotel.findOne({ name });
    if (hotelExists) {
      return res.status(400).json({ message: 'Tên khách sạn đã tồn tại' });
    }

    const hotel = new Hotel({
      name,
      address,
      region,
      contactNumber,
      email,
      description,
      rooms: rooms || [],
    });

    const savedHotel = await hotel.save();
    res.status(201).json({ message: 'Tạo khách sạn thành công', hotel: savedHotel });
  } catch (error) {
    console.error('Lỗi khi tạo khách sạn:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi tạo khách sạn', error: error.message });
  }
});

// PUT /api/hotels/:id - Cập nhật thông tin khách sạn
router.put('/:id', protect, admin, async (req, res) => {
  const { id } = req.params;
  const { name, address, region, contactNumber, email, description, rooms } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID khách sạn không hợp lệ' });
    }

    if (!name || !address || !region || !contactNumber || !email) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ các trường bắt buộc: name, address, region, contactNumber, email' });
    }

    if (!mongoose.Types.ObjectId.isValid(region)) {
      return res.status(400).json({ message: 'ID khu vực không hợp lệ' });
    }

    const regionExists = await Region.findById(region);
    if (!regionExists) {
      return res.status(404).json({ message: 'Không tìm thấy khu vực' });
    }

    if (rooms && rooms.length > 0) {
      const validRooms = await Room.find({ _id: { $in: rooms } });
      if (validRooms.length !== rooms.length) {
        return res.status(400).json({ message: 'Một hoặc nhiều phòng không tồn tại' });
      }
    }

    const hotel = await Hotel.findById(id);
    if (!hotel) {
      return res.status(404).json({ message: 'Không tìm thấy khách sạn' });
    }

    hotel.name = name;
    hotel.address = address;
    hotel.region = region;
    hotel.contactNumber = contactNumber;
    hotel.email = email;
    hotel.description = description || hotel.description;
    hotel.rooms = rooms || hotel.rooms;

    const updatedHotel = await hotel.save();
    res.status(200).json({ message: 'Cập nhật khách sạn thành công', hotel: updatedHotel });
  } catch (error) {
    console.error('Lỗi khi cập nhật khách sạn:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi cập nhật khách sạn', error: error.message });
  }
});

// DELETE /api/hotels/:id - Xóa khách sạn
router.delete('/:id', protect, admin, async (req, res) => {
  const { id } = req.params;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID khách sạn không hợp lệ' });
    }

    const hotel = await Hotel.findById(id);
    if (!hotel) {
      return res.status(404).json({ message: 'Không tìm thấy khách sạn' });
    }

    const activeBookings = await Booking.find({
      roomid: { $in: hotel.rooms },
      status: { $in: ['pending', 'confirmed'] },
    });

    if (activeBookings.length > 0) {
      return res.status(400).json({ message: 'Không thể xóa khách sạn vì vẫn còn đặt phòng đang hoạt động' });
    }

    await Hotel.deleteOne({ _id: id });
    res.status(200).json({ message: 'Xóa khách sạn thành công' });
  } catch (error) {
    console.error('Lỗi khi xóa khách sạn:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi xóa khách sạn', error: error.message });
  }
});

// POST /api/hotels/region - Phân vùng khu vực quản lý
router.post('/region', protect, admin, async (req, res) => {
  const { hotelId, regionId } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    if (!mongoose.Types.ObjectId.isValid(hotelId) || !mongoose.Types.ObjectId.isValid(regionId)) {
      return res.status(400).json({ message: 'ID khách sạn hoặc khu vực không hợp lệ' });
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: 'Không tìm thấy khách sạn' });
    }

    const region = await Region.findById(regionId);
    if (!region) {
      return res.status(404).json({ message: 'Không tìm thấy khu vực' });
    }

    hotel.region = regionId;
    await hotel.save();

    res.status(200).json({ message: 'Gán khu vực quản lý cho khách sạn thành công', hotel });
  } catch (error) {
    console.error('Lỗi khi gán khu vực quản lý:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi gán khu vực quản lý', error: error.message });
  }
});

module.exports = router;