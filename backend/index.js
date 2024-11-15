// 1. Load required modules
const express = require('express');
const mongoose = require('mongoose');
const userModel = require('./models/userModel')
const messageModel = require('./models/messageModel')
const http = require('http');
const socketIo = require('socket.io');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();





// 2. Initialize environment variables
const PORT = process.env.PORT || 8080;
const DB_URL = process.env.DB_URL;

// 3. Create app object
const app = express();
const server = http.createServer(app);

// Add this middleware before defining routes
app.use(express.json()); // to parse JSON-formatted request bodies
app.use(express.urlencoded({ extended: true })); // to parse URL-encoded request bodies

app.use(cors({
  origin: '*', // your frontend origin
 
}));
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins
  },
});

// 5. Define routes
const userRoutes = require('./routes/userRoutes');
const { log } = require('console');
app.use('/', userRoutes);

const users = new Map();

io.on('connection', (socket) => {


  socket.on('userConnected', async ({ _id }) => {
    users.set(_id, socket.id);
    socket.broadcast.emit('userConnected', {_id:_id})
    const updatedUser = await userModel.findByIdAndUpdate( _id, { $set: { status: 'online', socketId:socket.id } },{ new: true });
  })  

  socket.on('userDisconnected', async ({ _id }) => {
    users.delete(_id);
    socket.broadcast.emit('userDisconnected', {_id:_id})
    const updatedUser = await userModel.findByIdAndUpdate( _id, { $set: { status: 'offline', socketId:'', lastSeen: new Date().toISOString() } },{ new: true });
  })

  socket.on('userReconnected', async ({ _id }) => {
    users.set(_id, socket.id);
    socket.broadcast.emit('userConnected', {_id:_id})
    const updatedUser = await userModel.findByIdAndUpdate( _id, { $set: { status: 'online', socketId:socket.id } },{ new: true });
  })



  socket.on('iAmTyping', ({ _id }) => {
    socket.broadcast.emit('typing', _id)
  })
  

  socket.on('sendMessage', async (msgObject) => {
    const receiverId = msgObject.receiver._id;
    const receiverSocketId = users.get(receiverId);
    const newMsg = new messageModel(msgObject);
    const result = await newMsg.save(); 
    
    if (receiverSocketId) {
      socket.to(receiverSocketId).emit('receiveMessage', result);
    } else {
      console.log(`User with ID ${receiverId} is not connected`);

      await userModel.updateOne(
        { _id: receiverId },
        {
          $inc: { [`missedMessages.${msgObject.sender._id}`]: 1 }
        },
        { upsert: true }
      );
    
    }
 
  });

  
  socket.on('setmissedMsg', async({_id, senderId, content})=>{

    await userModel.updateOne(
      { _id: _id },
      {
        $set: {
          [`missedMessages.${senderId}.lastMsg`]: content // Update the last message
        },
        $inc: {
          [`missedMessages.${senderId}.count`]: 1 // Increment the count
        }
      },
      { upsert: true }
    );

  })

  socket.on('unsetmissedMsg', async ({ _id, senderId }) => {
    try {
      // Remove the senderId key from the missedMessages object
      await userModel.updateOne(
        { _id: _id },
        {
          $unset: { [`missedMessages.${senderId}`]: "" }
        }
      );
      console.log(`Removed missed messages for senderId ${senderId}`);
    } catch (error) {
      console.error("Error removing missed message:", error);
    }
  });

 













  socket.on('disconnect', async () => {
    users.forEach(async(socketId, key) => {
      if (socketId === socket.id) 
      {
        users.delete(key);
        socket.broadcast.emit('userDisconnected', {_id:key, users: Object.fromEntries(users.entries())})
        const updatedUser = await userModel.findByIdAndUpdate( key, { $set: { status: 'offline', socketId:'', lastSeen:new Date().toISOString() } },{ new: true });

      }
    });
  });


});























































































mongoose.connect(DB_URL).then(() => {
  console.log('Database connected...');
  server.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
    console.log('.......................................................................')

  });
}).catch((err) => {
  console.log('Something went wrong', err);
});
