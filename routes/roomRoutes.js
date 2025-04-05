const express = require("express");
const router = express.Router();
const mongoose = require("mongoose"); // Import mongoose
const Room = require("../models/room"); // Import the Room model

router.get('/getallrooms', async (req, res) => {
  try {
    const rooms = await Room.find({});
    res.send(rooms);
  } catch (error) {
    res.status(400).json({ message: error });
  }
});

router.post("/getroombyid", async (req, res) => {
   const { roomid } = req.body;
 
   try {
     // Kiểm tra nếu roomid không hợp lệ
     if (!mongoose.Types.ObjectId.isValid(roomid)) {
       return res.status(400).json({ message: "Invalid room ID" });
     }
 
     const room = await Room.findById(roomid);
 
     if (room) {
       res.send(room);
     } else {
       res.status(404).json({ message: "Room not found" });
     }
   } catch (error) {
     res.status(500).json({ message: "Error fetching room data", error });
   }
 });

module.exports = router;
