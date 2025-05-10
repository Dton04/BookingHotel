const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Booking = require("../models/booking");
const Room = require("../models/room");
const Voucher = require("../models/voucher");
const User = require("../models/user");

// Giả lập hàm xử lý thanh toán qua tài khoản ngân hàng
const processBankPayment = async (bookingData) => {
  try {
    const room = await Room.findById(bookingData.roomid);
    if (!room) {
      throw new Error("Không tìm thấy phòng để tính toán thanh toán.");
    }

    const checkinDate = new Date(bookingData.checkin);
    const checkoutDate = new Date(bookingData.checkout);
    const days = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
    
    const amount = room.rentperday * days;

    const bankInfo = {
      bankName: "Vietinbank",
      accountNumber: "104872827498",
      accountHolder: "Nguyen Tan Dat",
      amount: amount,
      content: `Thanh toán đặt phòng ${bookingData._id}`,
    };

    return {
      success: true,
      message: "Vui lòng chuyển khoản theo thông tin dưới đây để hoàn tất thanh toán. Bạn có 5 phút để hoàn thành.",
      bankInfo,
    };
  } catch (error) {
    throw new Error("Lỗi khi xử lý thanh toán qua tài khoản ngân hàng: " + error.message);
  }
};

// POST /api/bookings/apply-promotions - Áp dụng khuyến mãi
router.post("/apply-promotions", async (req, res) => {
  const { bookingData, voucherCodes } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (!bookingData || !bookingData.roomid || !bookingData.bookingId || !voucherCodes || !Array.isArray(voucherCodes)) {
      return res.status(400).json({ message: "Dữ liệu đặt phòng, ID đặt phòng hoặc mã khuyến mãi không hợp lệ" });
    }

    if (!mongoose.Types.ObjectId.isValid(bookingData.roomid) || !mongoose.Types.ObjectId.isValid(bookingData.bookingId)) {
      return res.status(400).json({ message: "ID phòng hoặc ID đặt phòng không hợp lệ" });
    }

    const checkinDate = new Date(bookingData.checkin);
    const checkoutDate = new Date(bookingData.checkout);
    if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime()) || checkinDate >= checkoutDate) {
      return res.status(400).json({ message: "Ngày nhận phòng hoặc trả phòng không hợp lệ" });
    }

    const room = await Room.findById(bookingData.roomid);
    if (!room) {
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }

    const booking = await Booking.findById(bookingData.bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đặt phòng" });
    }

    const days = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
    let totalAmount = room.rentperday * days;

    const vouchers = await Voucher.find({ code: { $in: voucherCodes } });
    if (!vouchers.length) {
      return res.status(404).json({ message: "Không tìm thấy mã khuyến mãi hợp lệ" });
    }

    let totalDiscount = 0;
    const appliedVouchers = [];

    for (const voucher of vouchers) {
      const now = new Date();
      if (now < voucher.startDate || now > voucher.endDate) {
        continue;
      }

      if (!voucher.applicableHotels.some(id => id.equals(bookingData.roomid))) {
        continue;
      }

      if (totalAmount < voucher.minBookingAmount) {
        continue;
      }

      let discount = 0;
      if (voucher.discountType === "percentage") {
        discount = (totalAmount * voucher.discountValue) / 100;
        if (voucher.maxDiscount && discount > voucher.maxDiscount) {
          discount = voucher.maxDiscount;
        }
      } else if (voucher.discountType === "fixed") {
        discount = voucher.discountValue;
      }

      if (!voucher.isStackable && appliedVouchers.length > 0) {
        continue;
      }

      totalDiscount += discount;
      appliedVouchers.push({
        code: voucher.code,
        discount,
      });
    }

    totalAmount = Math.max(0, totalAmount - totalDiscount);

    // Lưu thông tin giảm giá vào booking
    booking.voucherDiscount = totalDiscount;
    booking.appliedVouchers = appliedVouchers;
    await booking.save();

    res.status(200).json({
      message: "Áp dụng khuyến mãi thành công",
      totalAmount,
      appliedVouchers,
    });
  } catch (error) {
    console.error("Lỗi khi áp dụng khuyến mãi:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi áp dụng khuyến mãi", error: error.message });
  }
});

// POST /api/bookings - Đặt phòng
router.post("/", async (req, res) => {
  const { roomid, name, email, phone, checkin, checkout, adults, children, roomType, paymentMethod } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (!mongoose.Types.ObjectId.isValid(roomid)) {
      return res.status(400).json({ message: "ID phòng không hợp lệ" });
    }

    if (!name || !email || !phone || !checkin || !checkout || !adults || !roomType || !paymentMethod) {
      return res.status(400).json({ message: "Thiếu các trường bắt buộc" });
    }

    if (!['cash', 'credit_card', 'bank_transfer', 'mobile_payment'].includes(paymentMethod)) {
      return res.status(400).json({ message: "Phương thức thanh toán không hợp lệ" });
    }

    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);
    if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime()) || checkinDate >= checkoutDate) {
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
      children: Number(children) || 0,
      roomType,
      paymentMethod,
      paymentStatus: 'pending',
      paymentDeadline: paymentMethod === 'bank_transfer' ? new Date(Date.now() + 5 * 60 * 1000) : null,
    });

    await newBooking.save();

    let paymentResult;
    if (paymentMethod === 'bank_transfer') {
      paymentResult = await processBankPayment(newBooking);
    }

    room.currentbookings.push({
      bookingId: newBooking._id,
      checkin: checkinDate,
      checkout: checkoutDate,
    });
    await room.save();

    res.status(201).json({ message: "Đặt phòng thành công", booking: newBooking, paymentResult });
  } catch (error) {
    console.error("Lỗi khi đặt phòng:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi đặt phòng", error: error.message });
  }
});

// GET /api/bookings/history/:userId - Lịch sử đặt phòng
router.get("/history/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "ID người dùng không hợp lệ" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const bookings = await Booking.find({ email: user.email.toLowerCase() })
      .populate("roomid")
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Lỗi khi lấy lịch sử đặt phòng:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi lấy lịch sử đặt phòng", error: error.message });
  }
});

// Các endpoint khác giữ nguyên
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
    paymentMethod,
  } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (!mongoose.Types.ObjectId.isValid(roomid)) {
      return res.status(400).json({ message: "ID phòng không hợp lệ" });
    }

    if (!name || !email || !phone || !checkin || !checkout || !adults || children == null || !roomType || !paymentMethod) {
      return res.status(400).json({ message: "Thiếu các trường bắt buộc" });
    }

    if (!['cash', 'credit_card', 'bank_transfer', 'mobile_payment'].includes(paymentMethod)) {
      return res.status(400).json({ message: "Phương thức thanh toán không hợp lệ" });
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
      paymentMethod,
      paymentStatus: 'pending',
      paymentDeadline: paymentMethod === 'bank_transfer' ? new Date(Date.now() + 5 * 60 * 1000) : null,
    });

    await newBooking.save();

    let paymentResult;
    if (paymentMethod === 'bank_transfer') {
      paymentResult = await processBankPayment(newBooking);
    }

    room.currentbookings.push({
      bookingId: newBooking._id,
      checkin: checkinDate,
      checkout: checkoutDate,
    });
    await room.save();

    res.status(201).json({ message: "Đặt phòng thành công", booking: newBooking, paymentResult });
  } catch (error) {
    console.error("Lỗi trong API đặt phòng:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi đặt phòng", error: error.message });
  }
});

router.get("/:id/payment-deadline", async (req, res) => {
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

    if (booking.paymentMethod !== 'bank_transfer') {
      return res.status(400).json({ message: "Đặt phòng này không sử dụng thanh toán qua ngân hàng" });
    }

    if (!booking.paymentDeadline) {
      return res.status(400).json({ message: "Không có thời hạn thanh toán cho đặt phòng này" });
    }

    const currentTime = new Date();
    const timeRemaining = booking.paymentDeadline - currentTime;

    if (timeRemaining <= 0 && booking.paymentStatus === 'pending') {
      booking.status = 'canceled';
      booking.paymentStatus = 'canceled';
      await booking.save();

      const room = await Room.findById(booking.roomid);
      if (room) {
        room.currentbookings = room.currentbookings.filter(
          (b) => b.bookingId.toString() !== id
        );
        await room.save();
      }

      return res.status(200).json({
        message: "Thời gian thanh toán đã hết. Đặt phòng đã bị hủy.",
        timeRemaining: 0,
        expired: true,
      });
    }

    res.status(200).json({
      message: "Thời gian thanh toán còn lại",
      timeRemaining: Math.max(0, Math.floor(timeRemaining / 1000)),
      expired: false,
    });
  } catch (error) {
    console.error("Lỗi khi kiểm tra thời gian thanh toán:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi kiểm tra thời gian thanh toán", error: error.message });
  }
});

router.get("/summary", async (req, res) => {
  console.log("Xử lý yêu cầu /api/bookings/summary");
  try {
    console.log("Trạng thái kết nối MongoDB:", mongoose.connection.readyState);
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }
    const summary = await Booking.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    console.log("Kết quả aggregation:", summary);
    const result = { pending: 0, confirmed: 0, canceled: 0 };
    summary.forEach(item => { result[item._id] = item.count; });
    res.status(200).json(result);
  } catch (error) {
    console.error("Lỗi khi lấy thống kê trạng thái đặt phòng:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi lấy thống kê trạng thái đặt phòng", error: error.message });
  }
});

router.get("/recent", async (req, res) => {
  const { limit = 10 } = req.query;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    const parsedLimit = parseInt(limit);
    if (isNaN(parsedLimit) || parsedLimit < 1) {
      return res.status(400).json({ message: "Giới hạn phải là số nguyên dương" });
    }

    const bookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .populate("roomid");

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đặt phòng mới nhất:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi lấy danh sách đặt phòng mới nhất", error: error.message });
  }
});

router.post("/validate", async (req, res) => {
  const {
    roomid,
    checkin,
    checkout,
    adults,
    children,
    roomType,
  } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (!mongoose.Types.ObjectId.isValid(roomid)) {
      return res.status(400).json({ message: "ID phòng không hợp lệ" });
    }

    if (!checkin || !checkout || !adults || !children || !roomType) {
      return res.status(400).json({ message: "Thiếu các trường bắt buộc" });
    }

    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);
    if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime())) {
      return res.status(400).json({ message: "Ngày nhận phòng hoặc trả phòng không hợp lệ" });
    }

    if (checkinDate >= checkoutDate) {
      return res.status(400).json({ message: "Ngày nhận phòng phải trước ngày trả phòng" });
    }

    const room = await Room.findById(roomid);
    if (!room) {
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }

    if (room.availabilityStatus !== 'available') {
      return res.status(400).json({ message: `Phòng đang ở trạng thái ${room.availabilityStatus}, không thể đặt` });
    }

    if (room.type !== roomType) {
      return res.status(400).json({ message: "Loại phòng không khớp với phòng được chọn" });
    }

    if (room.maxcount < (Number(adults) + Number(children))) {
      return res.status(400).json({ message: "Số lượng người vượt quá sức chứa của phòng" });
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

    res.status(200).json({ message: "Dữ liệu đặt phòng hợp lệ" });
  } catch (error) {
    console.error("Lỗi khi kiểm tra dữ liệu đặt phòng:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi kiểm tra dữ liệu đặt phòng", error: error.message });
  }
});

router.get("/cancel-reason", async (req, res) => {
  const { bookingId } = req.query;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: "ID đặt phòng không hợp lệ hoặc thiếu" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đặt phòng với ID này" });
    }

    if (booking.status !== "canceled") {
      return res.status(400).json({ message: "Đặt phòng này chưa bị hủy" });
    }

    if (!booking.cancelReason) {
      return res.status(404).json({ message: "Không tìm thấy lý do hủy cho đặt phòng này" });
    }

    res.status(200).json({ cancelReason: booking.cancelReason });
  } catch (error) {
    console.error("Lỗi khi lấy lý do hủy:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi lấy lý do hủy", error: error.message });
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

    res.status(200).json({ hasBooked: true, booking, paymentStatus: booking.paymentStatus });
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
    booking.paymentStatus = "canceled";
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
    booking.paymentStatus = "paid";
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

router.get("/room/:roomId", async (req, res) => {
  const { roomId } = req.params;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: "ID phòng không hợp lệ" });
    }

    const bookings = await Booking.find({ roomid: roomId }).populate("roomid");
    if (!bookings.length) {
      return res.status(404).json({ message: "Không tìm thấy đặt phòng nào cho phòng này" });
    }

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đặt phòng theo phòng:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi lấy danh sách đặt phòng theo phòng", error: error.message });
  }
});

router.get("/stats/daily", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    const bookings = await Booking.find({ status: "confirmed" }).populate("roomid");
    
    const dailyRevenue = bookings.reduce((acc, booking) => {
      if (!booking.roomid || !booking.roomid.rentperday) return acc;

      const checkinDate = new Date(booking.checkin);
      const checkoutDate = new Date(booking.checkout);
      const days = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
      
      const dateKey = checkinDate.toISOString().split('T')[0];
      
      acc[dateKey] = (acc[dateKey] || 0) + (booking.roomid.rentperday * days);
      return acc;
    }, {});

    res.status(200).json(dailyRevenue);
  } catch (error) {
    console.error("Lỗi khi lấy thống kê doanh thu theo ngày:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi lấy thống kê doanh thu theo ngày", error: error.message });
  }
});

router.get("/stats/monthly", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    const bookings = await Booking.find({ status: "confirmed" }).populate("roomid");
    
    const monthlyRevenue = bookings.reduce((acc, booking) => {
      if (!booking.roomid || !booking.roomid.rentperday) return acc;

      const checkinDate = new Date(booking.checkin);
      const checkoutDate = new Date(booking.checkout);
      const days = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
      
      const monthKey = `${checkinDate.getFullYear()}-${String(checkinDate.getMonth() + 1).padStart(2, '0')}`;
      
      acc[monthKey] = (acc[monthKey] || 0) + (booking.roomid.rentperday * days);
      return acc;
    }, {});

    res.status(200).json(monthlyRevenue);
  } catch (error) {
    console.error("Lỗi khi lấy thống kê doanh thu theo tháng:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi lấy thống kê doanh thu theo tháng", error: error.message });
  }
});

router.patch("/:id/note", async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID đặt phòng không hợp lệ" });
    }

    if (!note || note.trim() === "") {
      return res.status(400).json({ message: "Ghi chú không được để trống" });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đặt phòng với ID này" });
    }

    if (booking.status === "canceled") {
      return res.status(400).json({ message: "Không thể thêm ghi chú cho đặt phòng đã hủy" });
    }

    booking.specialRequest = note;
    await booking.save();

    res.status(200).json({ message: "Cập nhật ghi chú thành công", booking });
  } catch (error) {
    console.error("Lỗi khi cập nhật ghi chú:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi cập nhật ghi chú", error: error.message });
  }
});

router.post("/:id/assign-room", async (req, res) => {
  const { id } = req.params;
  const { newRoomId } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID đặt phòng không hợp lệ" });
    }

    if (!mongoose.Types.ObjectId.isValid(newRoomId)) {
      return res.status(400).json({ message: "ID phòng mới không hợp lệ" });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đặt phòng với ID này" });
    }

    if (booking.status === "canceled") {
      return res.status(400).json({ message: "Không thể gán phòng cho đặt phòng đã hủy" });
    }

    const oldRoom = await Room.findById(booking.roomid);
    const newRoom = await Room.findById(newRoomId);

    if (!newRoom) {
      return res.status(404).json({ message: "Không tìm thấy phòng mới" });
    }

    if (newRoom.availabilityStatus !== "available") {
      return res.status(400).json({ message: `Phòng mới đang ở trạng thái ${newRoom.availabilityStatus}, không thể gán` });
    }

    if (newRoom.type !== booking.roomType) {
      return res.status(400).json({ message: "Loại phòng mới không khớp với loại phòng đã đặt" });
    }

    const isNewRoomBooked = newRoom.currentbookings.some(b => {
      const existingCheckin = new Date(b.checkin);
      const existingCheckout = new Date(b.checkout);
      return (
        (booking.checkin >= existingCheckin && booking.checkin < existingCheckout) ||
        (booking.checkout > existingCheckin && booking.checkout <= existingCheckout) ||
        (booking.checkin <= existingCheckin && booking.checkout >= existingCheckout)
      );
    });

    if (isNewRoomBooked) {
      return res.status(400).json({ message: "Phòng mới đã được đặt trong khoảng thời gian này" });
    }

    if (oldRoom) {
      oldRoom.currentbookings = oldRoom.currentbookings.filter(
        b => b.bookingId.toString() !== id
      );
      await oldRoom.save();
    }

    booking.roomid = newRoomId;
    await booking.save();

    newRoom.currentbookings.push({
      bookingId: booking._id,
      checkin: booking.checkin,
      checkout: booking.checkout,
    });
    await newRoom.save();

    res.status(200).json({ message: "Gán phòng mới thành công", booking });
  } catch (error) {
    console.error("Lỗi khi gán phòng:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi gán phòng", error: error.message });
  }
});

router.patch("/:id/extend", async (req, res) => {
  const { id } = req.params;
  const { newCheckout } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID đặt phòng không hợp lệ" });
    }

    if (!newCheckout) {
      return res.status(400).json({ message: "Ngày trả phòng mới là bắt buộc" });
    }

    const newCheckoutDate = new Date(newCheckout);
    if (isNaN(newCheckoutDate.getTime())) {
      return res.status(400).json({ message: "Ngày trả phòng mới không hợp lệ" });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đặt phòng với ID này" });
    }

    if (booking.status === "canceled") {
      return res.status(400).json({ message: "Không thể gia hạn cho đặt phòng đã hủy" });
    }

    const oldCheckoutDate = new Date(booking.checkout);
    if (newCheckoutDate <= oldCheckoutDate) {
      return res.status(400).json({ message: "Ngày trả phòng mới phải sau ngày trả phòng hiện tại" });
    }

    const room = await Room.findById(booking.roomid);
    if (!room) {
      return res.status(404).json({ message: "Không tìm thấy phòng liên quan đến đặt phòng này" });
    }

    const isRoomBooked = room.currentbookings.some(b => {
      if (b.bookingId.toString() === id) return false;
      const existingCheckin = new Date(b.checkin);
      const existingCheckout = new Date(b.checkout);
      return (
        (oldCheckoutDate < existingCheckin && newCheckoutDate > existingCheckin) ||
        (oldCheckoutDate < existingCheckout && newCheckoutDate > existingCheckout)
      );
    });

    if (isRoomBooked) {
      return res.status(400).json({ message: "Phòng không khả dụng trong khoảng thời gian gia hạn" });
    }

    booking.checkout = newCheckoutDate;
    await booking.save();

    const bookingInRoom = room.currentbookings.find(b => b.bookingId.toString() === id);
    if (bookingInRoom) {
      bookingInRoom.checkout = newCheckoutDate;
      await room.save();
    }

    res.status(200).json({ message: "Gia hạn thời gian lưu trú thành công", booking });
  } catch (error) {
    console.error("Lỗi khi gia hạn thời gian lưu trú:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi gia hạn thời gian lưu trú", error: error.message });
  }
});

router.post("/cancel-reason", async (req, res) => {
  const { bookingId, reason } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: "ID đặt phòng không hợp lệ hoặc thiếu" });
    }

    if (!reason || reason.trim() === "") {
      return res.status(400).json({ message: "Lý do hủy không được để trống" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đặt phòng với ID này" });
    }

    if (booking.status !== "canceled") {
      return res.status(400).json({ message: "Đặt phòng này chưa bị hủy" });
    }

    booking.cancelReason = reason;
    await booking.save();

    res.status(200).json({ message: "Gửi lý do hủy thành công", booking });
  } catch (error) {
    console.error("Lỗi khi gửi lý do hủy:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi gửi lý do hủy", error: error.message });
  }
});

router.patch("/:id/payment-method", async (req, res) => {
  const { id } = req.params;
  const { paymentMethod } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID đặt phòng không hợp lệ" });
    }

    if (!['cash', 'credit_card', 'bank_transfer', 'mobile_payment'].includes(paymentMethod)) {
      return res.status(400).json({ message: "Phương thức thanh toán không hợp lệ" });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đặt phòng với ID này" });
    }

    if (booking.status === "canceled") {
      return res.status(400).json({ message: "Không thể cập nhật phương thức thanh toán cho đặt phòng đã hủy" });
    }

    booking.paymentMethod = paymentMethod;
    await booking.save();

    res.status(200).json({ message: "Cập nhật phương thức thanh toán thành công", booking });
  } catch (error) {
    console.error("Lỗi khi cập nhật phương thức thanh toán:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi cập nhật phương thức thanh toán", error: error.message });
  }
});

module.exports = router;