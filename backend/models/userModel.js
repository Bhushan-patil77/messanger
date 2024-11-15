const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    socketId: String,
    status: String,
    recentChats: Array,
    lastSeen: String,
    missedMessages: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  });

const userModel = mongoose.model('User', userSchema)

module.exports = userModel  