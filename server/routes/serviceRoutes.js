const express = require('express');
const router = express.Router();
const Service = require('../models/service');
const Hotel = require('../models/hotel');
const { protect, admin } = require('../middleware/auth');

// @desc    Get all services
// @route   GET /api/services
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { hotelId, isAvailable } = req.query;
    const filter = {};

    if (hotelId) filter.hotelId = hotelId;
    if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';

    const services = await Service.find(filter)
      .populate('hotelId', 'name address')
      .sort({ createdAt: -1 });

    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách dịch vụ' });
  }
});

// @desc    Get service by ID
// @route   GET /api/services/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('hotelId', 'name address');

    if (!service) {
      return res.status(404).json({ message: 'Không tìm thấy dịch vụ' });
    }

    res.json(service);
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy thông tin dịch vụ' });
  }
});

// @desc    Create new service
// @route   POST /api/services
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      icon,
      hotelId,
      imageUrl,
      operatingHours,
      capacity,
      requiresBooking,
      isFree
    } = req.body;

    // Validate hotel exists
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: 'Không tìm thấy khách sạn' });
    }

    const service = new Service({
      name,
      description,
      price: isFree ? 0 : price,
      icon,
      hotelId,
      imageUrl,
      operatingHours,
      capacity,
      requiresBooking,
      isFree
    });

    const createdService = await service.save();
    const populatedService = await Service.findById(createdService._id)
      .populate('hotelId', 'name address');

    res.status(201).json(populatedService);
  } catch (error) {
    console.error('Error creating service:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Lỗi server khi tạo dịch vụ' });
  }
});

// @desc    Update service
// @route   PUT /api/services/:id
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      icon,
      imageUrl,
      operatingHours,
      capacity,
      requiresBooking,
      isFree,
      isAvailable
    } = req.body;

    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Không tìm thấy dịch vụ' });
    }

    service.name = name || service.name;
    service.description = description || service.description;
    service.price = isFree ? 0 : (price || service.price);
    service.icon = icon || service.icon;
    service.imageUrl = imageUrl || service.imageUrl;
    service.operatingHours = operatingHours || service.operatingHours;
    service.capacity = capacity !== undefined ? capacity : service.capacity;
    service.requiresBooking = requiresBooking !== undefined ? requiresBooking : service.requiresBooking;
    service.isFree = isFree !== undefined ? isFree : service.isFree;
    service.isAvailable = isAvailable !== undefined ? isAvailable : service.isAvailable;

    const updatedService = await service.save();
    const populatedService = await Service.findById(updatedService._id)
      .populate('hotelId', 'name address');

    res.json(populatedService);
  } catch (error) {
    console.error('Error updating service:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Lỗi server khi cập nhật dịch vụ' });
  }
});

// @desc    Delete service
// @route   DELETE /api/services/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Không tìm thấy dịch vụ' });
    }

    await Service.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xóa dịch vụ thành công' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ message: 'Lỗi server khi xóa dịch vụ' });
  }
});

// @desc    Get services by hotel
// @route   GET /api/services/hotel/:hotelId
// @access  Public
router.get('/hotel/:hotelId', async (req, res) => {
  try {
    const services = await Service.find({ 
      hotelId: req.params.hotelId,
      isAvailable: true 
    }).sort({ name: 1 });

    res.json(services);
  } catch (error) {
    console.error('Error fetching hotel services:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy dịch vụ khách sạn' });
  }
});

// @desc    Toggle service availability
// @route   PATCH /api/services/:id/toggle
// @access  Private/Admin
router.patch('/:id/toggle', protect, admin, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Không tìm thấy dịch vụ' });
    }

    service.isAvailable = !service.isAvailable;
    const updatedService = await service.save();
    const populatedService = await Service.findById(updatedService._id)
      .populate('hotelId', 'name address');

    res.json(populatedService);
  } catch (error) {
    console.error('Error toggling service:', error);
    res.status(500).json({ message: 'Lỗi server khi thay đổi trạng thái dịch vụ' });
  }
});

module.exports = router; 