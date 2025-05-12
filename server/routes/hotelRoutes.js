const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Hotel = require('../models/hotel');
const Room = require('../models/room');
const Region = require('../models/region');
const Booking = require('../models/booking');
const { protect, admin } = require('../middleware/auth');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Tạo thư mục uploads nếu chưa tồn tại
const uploadDir = path.join(__dirname, '../Uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'Uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file JPEG, PNG hoặc GIF'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
});

// GET /api/hotels - Lấy danh sách khách sạn (admin)
router.get('/', protect, admin, async (req, res) => {
  try {
    const hotels = await Hotel.find().populate('region', 'name').populate('rooms', 'name');
    res.status(200).json(hotels);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách khách sạn:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách khách sạn', error: error.message });
  }
});

// GET /api/hotels/by-region/:regionId - Lấy danh sách khách sạn theo khu vực
router.get('/by-region/:regionId', protect, admin, async (req, res) => {
  const { regionId } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(regionId)) {
      return res.status(400).json({ message: 'ID khu vực không hợp lệ' });
    }
    const hotels = await Hotel.find({ region: regionId })
      .populate('region', 'name')
      .populate('rooms', 'name');
    res.status(200).json(hotels);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách khách sạn theo khu vực:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách khách sạn theo khu vực', error: error.message });
  }
});

// GET /api/hotels/public - Lấy danh sách khách sạn công khai
router.get('/public', async (req, res) => {
  try {
    const hotels = await Hotel.find().populate('region', 'name').select('name address contactNumber email description imageurls');
    res.status(200).json(hotels);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách khách sạn công khai:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách khách sạn công khai', error: error.message });
  }
});

// GET /api/hotels/:id - Lấy thông tin chi tiết khách sạn theo ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID khách sạn không hợp lệ' });
    }
    const hotel = await Hotel.findById(id).populate('region', 'name').populate('rooms', 'name');
    if (!hotel) {
      return res.status(404).json({ message: 'Không tìm thấy khách sạn' });
    }
    res.status(200).json(hotel);
  } catch (error) {
    console.error('Lỗi khi lấy thông tin khách sạn:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi lấy thông tin khách sạn', error: error.message });
  }
});

// POST /api/hotels - Thêm khách sạn mới
router.post('/', protect, admin, upload.array('images', 5), async (req, res) => {
  const { name, address, region, province, district, contactNumber, email, description } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    const missingFields = [];
    if (!name) missingFields.push('name');
    if (!address) missingFields.push('address');
    if (!region) missingFields.push('region');
    if (!province) missingFields.push('province');
    if (!district) missingFields.push('district');
    if (!contactNumber) missingFields.push('contactNumber');
    if (!email) missingFields.push('email');

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Vui lòng cung cấp đầy đủ các trường bắt buộc: ${missingFields.join(', ')}`,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(region)) {
      return res.status(400).json({ message: 'ID khu vực không hợp lệ' });
    }

    const regionExists = await Region.findById(region);
    if (!regionExists) {
      return res.status(404).json({ message: 'Không tìm thấy khu vực' });
    }

    const phoneRegex = /^\d{10,11}$/;
    if (!phoneRegex.test(contactNumber)) {
      return res.status(400).json({ message: 'Số điện thoại phải có 10-11 chữ số' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Email không hợp lệ' });
    }

    const hotelExists = await Hotel.findOne({ name });
    if (hotelExists) {
      return res.status(400).json({ message: 'Tên khách sạn đã tồn tại' });
    }

    const imageurls = req.files ? req.files.map(file => `${req.protocol}://${req.get('host')}/Uploads/${file.filename}`) : [];

    const hotel = new Hotel({
      name,
      address,
      region,
      province,
      district,
      contactNumber: Number(contactNumber),
      email,
      description,
      imageurls,
      rooms: [], // Không gửi rooms từ client
    });

    const savedHotel = await hotel.save();
    res.status(201).json({ message: 'Tạo khách sạn thành công', hotel: savedHotel });
  } catch (error) {
    console.error('Lỗi khi tạo khách sạn:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi tạo khách sạn', error: error.message });
  }
});

// PUT /api/hotels/:id - Cập nhật thông tin khách sạn
router.put('/:id', protect, admin, upload.array('images', 5), async (req, res) => {
  const { id } = req.params;
  const { name, address, region, province, district, contactNumber, email, description } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID khách sạn không hợp lệ' });
    }

    const missingFields = [];
    if (!name) missingFields.push('name');
    if (!address) missingFields.push('address');
    if (!region) missingFields.push('region');
    if (!province) missingFields.push('province');
    if (!district) missingFields.push('district');
    if (!contactNumber) missingFields.push('contactNumber');
    if (!email) missingFields.push('email');

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Vui lòng cung cấp đầy đủ các trường bắt buộc: ${missingFields.join(', ')}`,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(region)) {
      return res.status(400).json({ message: 'ID khu vực không hợp lệ' });
    }

    const regionExists = await Region.findById(region);
    if (!regionExists) {
      return res.status(404).json({ message: 'Không tìm thấy khu vực' });
    }

    const phoneRegex = /^\d{10,11}$/;
    if (!phoneRegex.test(contactNumber)) {
      return res.status(400).json({ message: 'Số điện thoại phải có 10-11 chữ số' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Email không hợp lệ' });
    }

    const hotel = await Hotel.findById(id);
    if (!hotel) {
      return res.status(404).json({ message: 'Không tìm thấy khách sạn' });
    }

    const imageurls = req.files ? req.files.map(file => `${req.protocol}://${req.get('host')}/Uploads/${file.filename}`) : [];

    hotel.name = name;
    hotel.address = address;
    hotel.region = region;
    hotel.province = province;
    hotel.district = district;
    hotel.contactNumber = Number(contactNumber);
    hotel.email = email;
    hotel.description = description || hotel.description;
    hotel.imageurls = imageurls.length > 0 ? [...hotel.imageurls, ...imageurls] : hotel.imageurls;
    // Không cập nhật rooms từ client

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
      return res.status(400).json({ message: 'Không tìm thấy khách sạn' });
    }

    const activeBookings = await Booking.find({
      roomid: { $in: hotel.rooms },
      status: { $in: ['pending', 'confirmed'] },
    });

    if (activeBookings.length > 0) {
      return res.status(400).json({ message: 'Không thể xóa khách sạn vì vẫn còn đặt phòng đang hoạt động' });
    }

    // Xóa ảnh khỏi thư mục Uploads
    for (const url of hotel.imageurls) {
      const filePath = path.join(__dirname, '../', url.replace(`${req.protocol}://${req.get('host')}`, ''));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Hotel.deleteOne({ _id: id });
    res.status(200).json({ message: 'Xóa khách sạn thành công' });
  } catch (error) {
    console.error('Lỗi khi xóa khách sạn:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi xóa khách sạn', error: error.message });
  }
});

// POST /api/hotels/:id/images - Tải ảnh bổ sung
router.post('/:id/images', protect, admin, upload.array('images', 5), async (req, res) => {
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

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Vui lòng cung cấp ít nhất một ảnh' });
    }

    const newImages = req.files.map(file => `${req.protocol}://${req.get('host')}/Uploads/${file.filename}`);
    hotel.imageurls = [...hotel.imageurls, ...newImages];
    const updatedHotel = await hotel.save();

    res.status(201).json({ message: 'Tải ảnh khách sạn thành công', hotel: updatedHotel });
  } catch (error) {
    console.error('Lỗi khi tải ảnh khách sạn:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi tải ảnh khách sạn', error: error.message });
  }
});

// DELETE /api/hotels/:id/images/:imgId - Xóa ảnh khách sạn
router.delete('/:id/images/:imgId', protect, admin, async (req, res) => {
  const { id, imgId } = req.params;

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

    const imageIndex = hotel.imageurls.findIndex(url => url.includes(imgId));
    if (imageIndex === -1) {
      return res.status(404).json({ message: 'Không tìm thấy ảnh' });
    }

    const imageUrl = hotel.imageurls[imageIndex];
    const filePath = path.join(__dirname, '../', imageUrl.replace(`${req.protocol}://${req.get('host')}`, ''));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    hotel.imageurls.splice(imageIndex, 1);
    const updatedHotel = await hotel.save();

    res.status(200).json({ message: 'Xóa ảnh khách sạn thành công', hotel: updatedHotel });
  } catch (error) {
    console.error('Lỗi khi xóa ảnh khách sạn:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi xóa ảnh khách sạn', error: error.message });
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