const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();

// Cấu hình multer để lưu ảnh
const storage = multer.diskStorage({
   destination: (req, file, cb) => {
     cb(null, 'uploads/'); // Thư mục lưu ảnh
   },
   filename: (req, file, cb) => {
     cb(null, Date.now() + path.extname(file.originalname)); // Đặt tên file duy nhất
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
const contactRoute = require('./routes/contactRoutes'); // Đã sửa từ contactRoutes
const reviewRoute = require('./routes/reviewRoutes');

app.use(cors()); 
app.use(express.json()); 

app.use('/api/rooms', roomsRoute);
app.use('/api/bookings', bookingRoute); 
app.use('/api/users', usersRoute);
app.use('/api/reviews', upload.single('image'), reviewRoute);
app.use('/api', contactRoute); 


const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server is running on port ${port}`));