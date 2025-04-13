const express = require('express');
const cors = require('cors');
const app = express();

const dbConfig = require('./db');
const roomsRoute = require('./routes/roomRoutes');
const bookingRoute = require('./routes/bookingRoutes'); 
const usersRoute = require('./routes/usersRoutes');
const contactRoute = require('./routes/contactRoutes'); // Đã sửa từ contactRoutes

app.use(cors()); 
app.use(express.json()); 

app.use('/api/rooms', roomsRoute);
app.use('/api/bookings', bookingRoute); 
app.use('/api/users', usersRoute);
app.use('/api', contactRoute); // Sửa thành /api

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server is running on port ${port}`));