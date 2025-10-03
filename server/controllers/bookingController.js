// bookingController.js
const mongoose = require("mongoose");
const Booking = require("../models/booking");
const Room = require("../models/room");
const Discount = require("../models/discount");
const Transaction = require('../models/transaction');
const User = require("../models/user");

// Giả lập hàm xử lý thanh toán qua tài khoản ngân hàng
const processBankPayment = async (bookingData, session) => {
   try {
      const room = await Room.findById(bookingData.roomid).session(session);
      if (!room) {
         throw new Error("Không tìm thấy phòng để tính toán thanh toán.");
      }
      if (room.availabilityStatus !== "available") {
         throw new Error("Phòng không còn khả dụng để thanh toán.");
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
exports.applyPromotions = async (req, res) => {
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

      const booking = await Booking.findById(bookingData.bookingId).lean();
      if (!booking) {
         return res.status(404).json({ message: "Không tìm thấy đặt phòng" });
      }

      if (booking.status !== "pending" && booking.status !== "confirmed") {
         return res.status(400).json({ message: "Không thể áp dụng khuyến mãi cho đặt phòng đã hủy" });
      }

      const user = await User.findOne({ email: booking.email.toLowerCase() }).lean();
      if (!user) {
         return res.status(404).json({ message: "Không tìm thấy người dùng liên quan đến đặt phòng" });
      }

      const checkinDate = new Date(bookingData.checkin);
      const checkoutDate = new Date(bookingData.checkout);
      if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime()) || checkinDate >= checkoutDate) {
         return res.status(400).json({ message: "Ngày nhận phòng hoặc trả phòng không hợp lệ" });
      }

      const room = await Room.findById(bookingData.roomid).lean();
      if (!room) {
         return res.status(404).json({ message: "Không tìm thấy phòng" });
      }

      const days = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
      let totalAmount = room.rentperday * days;

      const discounts = await Discount.find({ code: { $in: voucherCodes }, type: "voucher", isDeleted: false });
      if (!discounts.length) {
         return res.status(404).json({ message: "Không tìm thấy mã khuyến mãi hợp lệ" });
      }

      let totalDiscount = 0;
      const appliedVouchers = [];
      const session = await mongoose.startSession();

      try {
         session.startTransaction();

         for (const discount of discounts) {
            const now = new Date();
            if (now < discount.startDate || now > discount.endDate) {
               continue;
            }

            if (discount.applicableHotels.length > 0 && !discount.applicableHotels.some((id) => id.equals(bookingData.roomid))) {
               continue;
            }

            if (totalAmount < discount.minBookingAmount) {
               continue;
            }

            const userUsage = discount.usedBy ? discount.usedBy.find((u) => u.userId.equals(user._id)) : null;
            if (userUsage && userUsage.count >= 1) {
               continue;
            }

            let discountAmount = 0;
            if (discount.discountType === "percentage") {
               discountAmount = (totalAmount * discount.discountValue) / 100;
               if (discount.maxDiscount && discountAmount > discount.maxDiscount) {
                  discountAmount = discount.maxDiscount;
               }
            } else if (discount.discountType === "fixed") {
               discountAmount = discount.discountValue;
            }

            if (!discount.isStackable && appliedVouchers.length > 0) {
               continue;
            }

            totalDiscount += discountAmount;
            appliedVouchers.push({
               code: discount.code,
               discount: discountAmount,
            });

            if (!discount.usedBy) discount.usedBy = [];
            if (userUsage) {
               userUsage.count += 1;
            } else {
               discount.usedBy.push({ userId: user._id, count: 1 });
            }
            await discount.save({ session });
         }

         totalAmount = Math.max(0, totalAmount - totalDiscount);

         await Booking.updateOne(
            { _id: bookingData.bookingId },
            { voucherDiscount: totalDiscount, appliedVouchers },
            { session }
         );

         await session.commitTransaction();
         res.status(200).json({
            message: "Áp dụng khuyến mãi thành công",
            totalAmount,
            appliedVouchers,
         });
      } catch (error) {
         await session.abortTransaction();
         throw error;
      } finally {
         session.endSession();
      }
   } catch (error) {
      console.error("Lỗi khi áp dụng khuyến mãi:", error.message, error.stack);
      res.status(500).json({ message: "Lỗi khi áp dụng khuyến mãi", error: error.message });
   }
};

// POST /api/bookings/checkout - Tạo giao dịch mới và tích điểm
exports.checkout = async (req, res) => {
   const { bookingId } = req.body;
   const session = await mongoose.startSession();

   try {
      session.startTransaction();

      // Kiểm tra kết nối database
      if (mongoose.connection.readyState !== 1) {
         throw new Error('Kết nối cơ sở dữ liệu chưa sẵn sàng');
      }

      // Kiểm tra bookingId hợp lệ
      if (!mongoose.Types.ObjectId.isValid(bookingId)) {
         throw new Error('ID đặt phòng không hợp lệ');
      }

      // Kiểm tra giao dịch đã tồn tại
      const existingTransaction = await Transaction.findOne({ bookingId }).session(session);
      if (existingTransaction) {
         throw new Error('Giao dịch cho đặt phòng này đã được tạo trước đó');
      }

      // Tìm booking
      const booking = await Booking.findById(bookingId)
         .populate('roomid')
         .session(session);
      if (!booking) {
         throw new Error('Không tìm thấy đặt phòng');
      }

      // Kiểm tra trạng thái booking
      if (booking.status !== 'confirmed' || booking.paymentStatus !== 'paid') {
         throw new Error('Đặt phòng chưa được xác nhận hoặc chưa thanh toán, không thể tích điểm');
      }

      // Tìm user
      const user = await User.findOne({ email: booking.email.toLowerCase() })
         .session(session);
      if (!user) {
         throw new Error('Không tìm thấy người dùng liên quan đến đặt phòng');
      }

      // Kiểm tra quyền truy cập
      if (req.user._id.toString() !== user._id.toString() && !['admin', 'staff'].includes(req.user.role)) {
         throw new Error('Không có quyền tích điểm cho người dùng này');
      }

      // Tính số tiền booking
      const checkinDate = new Date(booking.checkin);
      const checkoutDate = new Date(booking.checkout);
      const days = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
      const totalAmount = booking.roomid.rentperday * days - (booking.voucherDiscount || 0);

      // Tính điểm (1 điểm cho mỗi 100,000 VND)
      const pointsEarned = Math.floor(totalAmount * 0.01);

      // Tạo giao dịch
      const transaction = new Transaction({
         userId: user._id,
         bookingId: booking._id,
         amount: totalAmount,
         points: pointsEarned,
         type: 'earn',
         status: 'completed',
      });
      await transaction.save({ session });

      // Cập nhật điểm cho user
      user.points = (user.points || 0) + pointsEarned;
      await user.save({ session });

      // Commit transaction
      await session.commitTransaction();

      res.status(201).json({
         message: 'Tích điểm thành công',
         transaction,
         pointsEarned,
         totalPoints: user.points,
      });
   } catch (error) {
      await session.abortTransaction();
      console.error('Lỗi khi tích điểm:', error.message, error.stack);
      res.status(500).json({ message: 'Lỗi khi tích điểm', error: error.message });
   } finally {
      session.endSession();
   }
};

// POST /api/bookings - Đặt phòng
exports.createBooking = async (req, res) => {
   const { roomid, name, email, phone, checkin, checkout, adults, children, roomType, paymentMethod } = req.body;
   const session = await mongoose.startSession();

   try {
      session.startTransaction();

      if (!mongoose.Types.ObjectId.isValid(roomid)) {
         return res.status(400).json({ message: "ID phòng không hợp lệ" });
      }
      if (!name || !email || !phone || !checkin || !checkout || !adults || !roomType || !paymentMethod) {
         return res.status(400).json({ message: "Thiếu các trường bắt buộc" });
      }
      if (!["cash", "credit_card", "bank_transfer", "mobile_payment", "vnpay"].includes(paymentMethod)) {
         return res.status(400).json({ message: "Phương thức thanh toán không hợp lệ" });
      }

      const checkinDate = new Date(checkin);
      const checkoutDate = new Date(checkout);
      if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime()) || checkinDate >= checkoutDate) {
         return res.status(400).json({ message: "Ngày nhận phòng hoặc trả phòng không hợp lệ" });
      }

      const room = await Room.findById(roomid).session(session);
      if (!room) {
         return res.status(404).json({ message: "Không tìm thấy phòng" });
      }

      if (room.availabilityStatus !== "available") {
         return res.status(400).json({ message: `Phòng đang ở trạng thái ${room.availabilityStatus}, không thể đặt` });
      }

      if (room.maxcount < Number(adults) + Number(children || 0)) {
         return res.status(400).json({ message: "Số lượng người vượt quá sức chứa của phòng" });
      }

      const isRoomBooked = room.currentbookings.some((booking) => {
         const existingCheckin = new Date(booking.checkin);
         const existingCheckout = new Date(booking.checkout);
         return (
            (checkinDate >= existingCheckin && checkinDate < existingCheckout) ||
            (checkoutDate > existingCheckin && checkoutDate <= existingCheckout) ||
            (checkinDate <= existingCheckin && checkoutDate >= existingCheckout)
         );
      });

      if (isRoomBooked) {
         throw new Error("Phòng đã được đặt trong khoảng thời gian này");
      }

      const newBooking = new Booking({
         hotelId: room.hotelId,   
         roomid,
         name,
         email: email.toLowerCase(),
         phone,
         checkin: checkinDate,
         checkout: checkoutDate,
         adults: Number(adults),
         children: Number(children) || 0,
         roomType,
         paymentMethod,
         paymentStatus: "pending",
         paymentDeadline: paymentMethod === "bank_transfer" ? new Date(Date.now() + 5 * 60 * 1000) : null,
      });

      await newBooking.save({ session });

      let paymentResult = null;

      if (paymentMethod === "bank_transfer") {
         paymentResult = await processBankPayment(newBooking, session);
      } else if (paymentMethod === "cash") {
         // vẫn pending để admin check
         paymentResult = {
            success: true,
            message: "Đặt phòng bằng tiền mặt. Vui lòng thanh toán trực tiếp tại quầy khi nhận phòng. Admin sẽ kiểm tra trước khi xác nhận."
         };
      }

      room.currentbookings.push({
         bookingId: newBooking._id,
         checkin: checkinDate,
         checkout: checkoutDate,
      });
      await room.save({ session });

      await session.commitTransaction();
      res.status(201).json({ message: "Đặt phòng thành công", booking: newBooking, paymentResult });
   } catch (error) {
      await session.abortTransaction();
      console.error("Lỗi khi đặt phòng:", error.message, error.stack);
      res.status(500).json({ message: "Lỗi khi đặt phòng", error: error.message });
   } finally {
      session.endSession();
   }
};

// POST /api/bookings/bookroom - Đặt phòng
exports.bookRoom = async (req, res) => {
   const { roomid, checkin, checkout, adults, children, name, email, phone, paymentMethod } = req.body;
   const session = await mongoose.startSession();

   try {
      session.startTransaction();

      if (!mongoose.Types.ObjectId.isValid(roomid)) {
         throw new Error("ID phòng không hợp lệ");
      }

      const checkinDate = new Date(checkin);
      const checkoutDate = new Date(checkout);
      if (isNaN(checkinDate) || isNaN(checkoutDate) || checkinDate >= checkoutDate) {
         throw new Error("Ngày nhận phòng hoặc trả phòng không hợp lệ");
      }

      const room = await Room.findById(roomid).session(session);
      if (!room) throw new Error("Không tìm thấy loại phòng");

      if (room.quantity <= 0) {
         throw new Error("Loại phòng này đã hết");
      }

      // Tổng số khách
      const totalGuests = Number(adults) + Number(children || 0);

      // Tính số phòng cần dùng
      const roomsNeeded = Math.ceil(totalGuests / room.maxcount);
      if (roomsNeeded > room.quantity) {
         throw new Error("Không đủ số phòng loại này cho " + totalGuests + " khách");
      }

      // Tạo booking
      const days = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
      const totalAmount = room.rentperday * days * roomsNeeded;

      const booking = new Booking({
         hotelId: room.hotelId,
         roomid,
         roomType: room.type,
         checkin: checkinDate,
         checkout: checkoutDate,
         adults,
         children,
         name,
         email,
         phone,
         paymentMethod,
         totalAmount,
         status: "pending",
         paymentStatus: "pending",
         roomsBooked: roomsNeeded, // thêm field này vào Booking model
      });

      await booking.save({ session });

      // Giảm số lượng phòng còn lại
      room.quantity -= roomsNeeded;
      await room.save({ session });

      await session.commitTransaction();

      res.status(201).json({ message: "Đặt phòng thành công", booking });
   } catch (error) {
      await session.abortTransaction();
      console.error("Lỗi khi đặt phòng:", error.message);
      res.status(500).json({ message: error.message });
   } finally {
      session.endSession();
   }
};


// DELETE /api/bookings/:id - Hủy đặt phòng
exports.cancelBooking = async (req, res) => {
   const { id } = req.params;
   const session = await mongoose.startSession();

   try {
      if (mongoose.connection.readyState !== 1) {
         throw new Error("Kết nối cơ sở dữ liệu chưa sẵn sàng");
      }

      if (!mongoose.Types.ObjectId.isValid(id)) {
         throw new Error("ID đặt phòng không hợp lệ");
      }

      session.startTransaction();

      // Tìm booking
      const booking = await Booking.findById(id).session(session);
      if (!booking) {
         throw new Error("Không tìm thấy đặt phòng với ID này");
      }

      // Nếu đã bị hủy
      if (booking.status === "canceled") {
         throw new Error("Đặt phòng đã bị hủy trước đó");
      }

      // Nếu đã thanh toán + xác nhận
      if (booking.status === "confirmed" && booking.paymentStatus === "paid") {
         throw new Error("Đặt phòng đã xác nhận và thanh toán, không thể hủy. Vui lòng liên hệ admin.");
      }

      // Kiểm tra thời gian (ví dụ chỉ cho hủy trong 24h sau khi đặt)
      const createdAt = new Date(booking.createdAt);
      const now = new Date();
      const hoursSinceCreated = (now - createdAt) / (1000 * 60 * 60);
      if (hoursSinceCreated > 24) {
         throw new Error("Không thể hủy đặt phòng vì đã quá 24 giờ kể từ khi đặt.");
      }

      // Cập nhật trạng thái booking
      booking.status = "canceled";
      booking.paymentStatus = booking.paymentStatus === "paid" ? "refunded" : "pending";
      booking.cancelDate = new Date();
      await booking.save({ session });

      // Hoàn trả lại số phòng đã đặt
      const room = await Room.findById(booking.roomid).session(session);
      if (room) {
         if (booking.roomsBooked) {
            room.quantity += booking.roomsBooked; // ✅ trả lại số phòng
         }

         // Nếu vẫn muốn quản lý lịch đặt theo ngày thì giữ currentbookings
         room.currentbookings = room.currentbookings.filter(
            (b) => !b.bookingId || b.bookingId.toString() !== id
         );

         if (room.currentbookings.length === 0 && room.quantity > 0) {
            room.availabilityStatus = "available";
         }

         await room.save({ session });
      }

      await session.commitTransaction();

      res.status(200).json({
         message: "Hủy đặt phòng thành công",
         booking: {
            _id: booking._id,
            status: booking.status,
            cancelDate: booking.cancelDate,
         },
      });
   } catch (error) {
      await session.abortTransaction();
      console.error("Lỗi khi hủy đặt phòng:", error.message);
      res.status(400).json({ message: error.message || "Lỗi khi hủy đặt phòng" });
   } finally {
      session.endSession();
   }
};



// PUT /api/bookings/:id/confirm - Xác nhận đặt phòng
exports.confirmBooking = async (req, res) => {
   const { id } = req.params;
   const session = await mongoose.startSession();

   try {
      session.startTransaction();

      if (!mongoose.Types.ObjectId.isValid(id)) {
         throw new Error("ID đặt phòng không hợp lệ");
      }

      const booking = await Booking.findById(id).session(session);
      if (!booking) {
         throw new Error("Không tìm thấy đặt phòng với ID này");
      }

      if (booking.status === "confirmed") {
         throw new Error("Đặt phòng này đã được xác nhận trước đó");
      }

      if (booking.status === "canceled") {
         throw new Error("Không thể xác nhận một đặt phòng đã bị hủy");
      }

      booking.status = "confirmed";
      booking.paymentStatus = "paid";
      await booking.save({ session });

      // Tự động tích điểm sau khi xác nhận thanh toán
      try {
         const user = await User.findOne({ email: booking.email.toLowerCase() }).session(session);
         if (user) {
            const room = await Room.findById(booking.roomid).session(session);
            const checkinDate = new Date(booking.checkin);
            const checkoutDate = new Date(booking.checkout);
            const days = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
            const totalAmount = room.rentperday * days - (booking.voucherDiscount || 0);
            const pointsEarned = Math.floor(totalAmount * 0.01);

            const existingTransaction = await Transaction.findOne({ bookingId: id }).session(session);
            if (!existingTransaction) {
               const transaction = new Transaction({
                  userId: user._id,
                  bookingId: booking._id,
                  amount: totalAmount,
                  points: pointsEarned,
                  type: 'earn',
                  status: 'completed',
               });
               await transaction.save({ session });

               user.points = (user.points || 0) + pointsEarned;
               await user.save({ session });
            }
         }
      } catch (error) {
         console.error('Lỗi khi tích điểm tự động:', error.message);
      }

      await session.commitTransaction();
      res.status(200).json({ message: "Xác nhận đặt phòng thành công", booking });
   } catch (error) {
      await session.abortTransaction();
      console.error("Lỗi khi xác nhận đặt phòng:", error.message, error.stack);
      res.status(500).json({ message: "Lỗi khi xác nhận đặt phòng", error: error.message });
   } finally {
      session.endSession();
   }
};

// GET /api/bookings - Lấy danh sách đặt phòng
exports.getBookings = async (req, res) => {
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
         query.email = email.toLowerCase();
      }

      const bookings = await Booking.find(query)
  .populate("roomid")
  .populate("hotelId", "name address") // thêm dòng này để hotelId có dữ liệu
  .lean();

      res.status(200).json(bookings);
   } catch (error) {
      console.error("Lỗi khi lấy danh sách đặt phòng:", error.message, error.stack);
      res.status(500).json({ message: "Lỗi khi lấy danh sách đặt phòng", error: error.message });
   }
};

// GET /api/bookings/room/:roomId - Lấy danh sách đặt phòng theo phòng
exports.getBookingsByRoom = async (req, res) => {
   const { roomId } = req.params;

   try {
      if (mongoose.connection.readyState !== 1) {
         return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
      }

      if (!mongoose.Types.ObjectId.isValid(roomId)) {
         return res.status(400).json({ message: "ID phòng không hợp lệ" });
      }

      const bookings = await Booking.find({ roomid: roomId }).populate("roomid").lean();
      if (!bookings.length) {
         return res.status(404).json({ message: "Không tìm thấy đặt phòng nào cho phòng này" });
      }

      res.status(200).json(bookings);
   } catch (error) {
      console.error("Lỗi khi lấy danh sách đặt phòng theo phòng:", error.message, error.stack);
      res.status(500).json({ message: "Lỗi khi lấy danh sách đặt phòng theo phòng", error: error.message });
   }
};

// GET /api/bookings/stats/daily - Thống kê doanh thu theo ngày
exports.getDailyStats = async (req, res) => {
   try {
      if (mongoose.connection.readyState !== 1) {
         return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
      }

      const bookings = await Booking.find({ status: "confirmed" }).populate("roomid").lean();

      const dailyRevenue = bookings.reduce((acc, booking) => {
         if (!booking.roomid || !booking.roomid.rentperday) return acc;

         const checkinDate = new Date(booking.checkin);
         const checkoutDate = new Date(booking.checkout);
         const days = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));

         const dateKey = checkinDate.toISOString().split("T")[0];

         acc[dateKey] = (acc[dateKey] || 0) + booking.roomid.rentperday * days;
         return acc;
      }, {});

      res.status(200).json(dailyRevenue);
   } catch (error) {
      console.error("Lỗi khi lấy thống kê doanh thu theo ngày:", error.message, error.stack);
      res.status(500).json({ message: "Lỗi khi lấy thống kê doanh thu theo ngày", error: error.message });
   }
};

// GET /api/bookings/stats/monthly - Thống kê doanh thu theo tháng
exports.getMonthlyStats = async (req, res) => {
   try {
      if (mongoose.connection.readyState !== 1) {
         return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
      }

      const bookings = await Booking.find({ status: "confirmed" }).populate("roomid").lean();

      const monthlyRevenue = bookings.reduce((acc, booking) => {
         if (!booking.roomid || !booking.roomid.rentperday) return acc;

         const checkinDate = new Date(booking.checkin);
         const checkoutDate = new Date(booking.checkout);
         const days = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));

         const monthKey = `${checkinDate.getFullYear()}-${String(checkinDate.getMonth() + 1).padStart(2, "0")}`;

         acc[monthKey] = (acc[monthKey] || 0) + booking.roomid.rentperday * days;
         return acc;
      }, {});

      res.status(200).json(monthlyRevenue);
   } catch (error) {
      console.error("Lỗi khi lấy thống kê doanh thu theo tháng:", error.message, error.stack);
      res.status(500).json({ message: "Lỗi khi lấy thống kê doanh thu theo tháng", error: error.message });
   }
};

// PATCH /api/bookings/:id/note - Cập nhật ghi chú
exports.updateNote = async (req, res) => {
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
};

// POST /api/bookings/:id/assign-room - Gán phòng mới
exports.assignRoom = async (req, res) => {
   const { id } = req.params;
   const { newRoomId } = req.body;
   const session = await mongoose.startSession();

   try {
      session.startTransaction();

      if (!mongoose.Types.ObjectId.isValid(id)) {
         throw new Error("ID đặt phòng không hợp lệ");
      }

      if (!mongoose.Types.ObjectId.isValid(newRoomId)) {
         throw new Error("ID phòng mới không hợp lệ");
      }

      const booking = await Booking.findById(id).session(session);
      if (!booking) {
         throw new Error("Không tìm thấy đặt phòng với ID này");
      }

      if (booking.status === "canceled") {
         throw new Error("Không thể gán phòng cho đặt phòng đã hủy");
      }

      const oldRoom = await Room.findById(booking.roomid).session(session);
      const newRoom = await Room.findById(newRoomId).session(session);

      if (!newRoom) {
         throw new Error("Không tìm thấy phòng mới");
      }

      if (newRoom.availabilityStatus !== "available") {
         throw new Error(`Phòng mới đang ở trạng thái ${newRoom.availabilityStatus}, không thể gán`);
      }

      if (newRoom.type !== booking.roomType) {
         throw new Error("Loại phòng mới không khớp với loại phòng đã đặt");
      }

      const isNewRoomBooked = newRoom.currentbookings.some((b) => {
         const existingCheckin = new Date(b.checkin);
         const existingCheckout = new Date(b.checkout);
         return (
            (booking.checkin >= existingCheckin && booking.checkin < existingCheckout) ||
            (booking.checkout > existingCheckin && booking.checkout <= existingCheckout) ||
            (booking.checkin <= existingCheckin && booking.checkout >= existingCheckout)
         );
      });

      if (isNewRoomBooked) {
         throw new Error("Phòng mới đã được đặt trong khoảng thời gian này");
      }

      if (oldRoom) {
         oldRoom.currentbookings = oldRoom.currentbookings.filter((b) => b.bookingId && b.bookingId.toString() !== id);
         await oldRoom.save({ session });
      }

      booking.roomid = newRoomId;
      await booking.save({ session });

      newRoom.currentbookings.push({
         bookingId: booking._id,
         checkin: booking.checkin,
         checkout: booking.checkout,
      });
      await newRoom.save({ session });

      await session.commitTransaction();
      res.status(200).json({ message: "Gán phòng mới thành công", booking });
   } catch (error) {
      await session.abortTransaction();
      console.error("Lỗi khi gán phòng:", error.message, error.stack);
      res.status(500).json({ message: "Lỗi khi gán phòng", error: error.message });
   } finally {
      session.endSession();
   }
};

// PATCH /api/bookings/:id/extend - Gia hạn thời gian lưu trú
exports.extendStay = async (req, res) => {
   const { id } = req.params;
   const { newCheckout } = req.body;
   const session = await mongoose.startSession();

   try {
      session.startTransaction();

      if (!mongoose.Types.ObjectId.isValid(id)) {
         throw new Error("ID đặt phòng không hợp lệ");
      }

      if (!newCheckout) {
         throw new Error("Ngày trả phòng mới là bắt buộc");
      }

      const newCheckoutDate = new Date(newCheckout);
      if (isNaN(newCheckoutDate.getTime())) {
         throw new Error("Ngày trả phòng mới không hợp lệ");
      }

      const booking = await Booking.findById(id).session(session);
      if (!booking) {
         throw new Error("Không tìm thấy đặt phòng với ID này");
      }

      if (booking.status === "canceled") {
         throw new Error("Không thể gia hạn cho đặt phòng đã hủy");
      }

      const oldCheckoutDate = new Date(booking.checkout);
      if (newCheckoutDate <= oldCheckoutDate) {
         throw new Error("Ngày trả phòng mới phải sau ngày trả phòng hiện tại");
      }

      const room = await Room.findById(booking.roomid).session(session);
      if (!room) {
         throw new Error("Không tìm thấy phòng liên quan đến đặt phòng này");
      }

      const isRoomBooked = room.currentbookings.some((b) => {
         if (b.bookingId && b.bookingId.toString() === id) return false;
         const existingCheckin = new Date(b.checkin);
         const existingCheckout = new Date(b.checkout);
         return (
            (oldCheckoutDate < existingCheckin && newCheckoutDate > existingCheckin) ||
            (oldCheckoutDate < existingCheckout && newCheckoutDate > existingCheckout)
         );
      });

      if (isRoomBooked) {
         throw new Error("Phòng không khả dụng trong khoảng thời gian gia hạn");
      }

      booking.checkout = newCheckoutDate;
      await booking.save({ session });

      const bookingInRoom = room.currentbookings.find((b) => b.bookingId && b.bookingId.toString() === id);
      if (bookingInRoom) {
         bookingInRoom.checkout = newCheckoutDate;
         await room.save({ session });
      }

      await session.commitTransaction();
      res.status(200).json({ message: "Gia hạn thời gian lưu trú thành công", booking });
   } catch (error) {
      await session.abortTransaction();
      console.error("Lỗi khi gia hạn thời gian lưu trú:", error.message, error.stack);
      res.status(500).json({ message: "Lỗi khi gia hạn thời gian lưu trú", error: error.message });
   } finally {
      session.endSession();
   }
};

// POST /api/bookings/cancel-reason - Gửi lý do hủy
exports.sendCancelReason = async (req, res) => {
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
};

//GET /api/booking/cancel-reason - Lấy lý do hủy
exports.getCancelReason = async (req, res) => {
   const { bookingId } = req.query;

   const booking = await Booking.findById(bookingId).lean();
   if (!booking) {
      return res.status(400).json({ message: "Không tìm thấy id phòng" })
   }
   if (!booking.cancelReason) {
      return res.status(400).json({ message: "Đặt phòng này chưa có lý do hủy" });
   }
   res.json({ cancelReason: booking.cancelReason });
};

// PATCH /api/bookings/:id/payment-method - Cập nhật phương thức thanh toán
exports.updatePaymentMethod = async (req, res) => {
   const { id } = req.params;
   const { paymentMethod } = req.body;

   try {
      if (mongoose.connection.readyState !== 1) {
         return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
      }

      if (!mongoose.Types.ObjectId.isValid(id)) {
         return res.status(400).json({ message: "ID đặt phòng không hợp lệ" });
      }

      if (!["cash", "credit_card", "bank_transfer", "mobile_payment", "vnpay"].includes(paymentMethod)) {
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
};