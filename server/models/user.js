const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
   name: {
      type: String,
      required: true
   },
   email:{
      type: String,
      required: true,
      unique: true
   },
   password: {
      type: String,
      required: true
   },
   isAdmin: {
      type: Boolean,
      default: false
   },
   role: {
      type: String,
      enum: ['user', 'admin', 'staff'],
      default: 'user'
   },
   isDelete: { 
      type: Boolean, 
      default: false 
   },
   phone: { 
      type: String, 
      maxlength: 10 
   },
   avatar: {
      type: String,
      default: ''
   
   },
   points: {
      type: Number,
      default: 0,

      // Điểm tích lũy
    },
    region: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Region',
      default: null,
      // Khu vực quản lý (cho admin)
   }
},
   {
   timestamps: true,
})
const userModel = mongoose.model('users', userSchema)

module.exports = userModel