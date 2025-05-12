const mongoose = require("mongoose");

const hotelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  region: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Region",
    required: true,
  },
  province: {
    type: String,
    required: true,
  },
  district: {
    type: String,
    required: true,
  },
  contactNumber: {
    type: Number,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  imageurls: {
    type: [String],
    default: [],
  },
  rooms: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model("Hotel", hotelSchema);