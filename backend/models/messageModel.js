const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
    sender:  {
        _id: String,
        username: String,
        email: String,
        password: String,
        socketId: String,
        status: String,
    } ,
    receiver:  {
        _id: String,
        username: String,
        email: String,
        password: String,
        socketId: String,
        status: String,
    } ,
    content: String,
    read:Boolean
}, { timestamps: true });
const messageModel = mongoose.model('message', messageSchema)




module.exports = messageModel