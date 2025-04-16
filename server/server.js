
require('dotenv').config();


// server.js

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose'); // Thêm mongoose

// Kiểm tra JWT_SECRET
console.log('JWT_SECRET:', process.env.JWT_SECRET);
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in .env file');
}

const app = express();

// Cấu hình multer để lưu ảnh
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Tạo thư mục uploads nếu chưa có
const fs = require('fs');
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Phục vụ file tĩnh từ thư mục uploads
app.use('/uploads', express.static('uploads'));

const dbConfig = require('./db');
const roomsRoute = require('./routes/roomRoutes');
const bookingRoute = require('./routes/bookingRoutes');
const usersRoute = require('./routes/usersRoutes');
const contactRoute = require('./routes/contactRoutes');
const reviewRoute = require('./routes/reviewRoutes');

app.use(cors());
app.use(express.json());

app.use('/api/rooms', roomsRoute);
app.use('/api/bookings', bookingRoute);
app.use('/api/users', usersRoute);

app.use('/api', contactRoute);
app.use('/api/reviews', reviewRoute);


const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server is running on port ${port}`));