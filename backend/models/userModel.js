const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    socketId: String,
    status: String,
    recentChats: Array,
    lastSeen: String,
    unreadMessages: {
      type: Object,  // Using Object to store random _id as key
      default: {}
    }
  });

const userModel = mongoose.model('User', userSchema)

module.exports = userModel  