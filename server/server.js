const express = require('express');
const cors = require('cors'); // Thêm cors

const app = express();

const dbConfig = require('./db');
const roomsRoute = require('./routes/roomRoutes');
const bookingRoute = require('./routes/bookingRoutes'); 
app.use(cors()); 
app.use(express.json()); 

app.use('/api/rooms', roomsRoute);
app.use('/api/bookings', bookingRoute); 

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server is running on port ${port}`));