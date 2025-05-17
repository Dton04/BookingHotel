const mongoose = require('mongoose');
const Review = require('../models/review')
const Room = require('../models/room');
const Hotel = require('../models/hotel');

async function migrateReviews() {
  try {
    await mongoose.connect('mongodb+srv://tandat:0123456Az@cluster0.d2rkr.mongodb.net/mem-rooms', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const reviews = await Review.find({}).populate('roomId');
    for (const review of reviews) {
      if (review.roomId) {
        const room = await Room.findById(review.roomId);
        if (room) {
          const hotel = await Hotel.findOne({ rooms: review.roomId });
          if (hotel) {
            review.hotelId = hotel._id;
            await review.save();
            console.log(`Đã cập nhật đánh giá ${review._id} với hotelId: ${hotel._id}`);
          }
        }
      }
    }

    console.log('Di chuyển đánh giá hoàn tất');
    mongoose.connection.close();
  } catch (error) {
    console.error('Lỗi khi di chuyển đánh giá:', error);
    mongoose.connection.close();
  }
}

migrateReviews();