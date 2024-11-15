const mongoose = require('mongoose');
const userModel = require('../models/userModel')
const messageModel = require('../models/messageModel')
const ObjectId = mongoose.Types.ObjectId;

exports.clearDB = async (req, res) => {

  try {

    await userModel.collection.drop();
    await messageModel.collection.drop();

  } catch (error) {

    res.status(500).json({ error: 'An error occurred while clearing DB...' })

  }



}

exports.registerUser = async (req, res) => {

  try {

    const newUser = new userModel(req.body);
    const data = await newUser.save();
    res.status(200).json({ message: 'User Registered Successfully...', data: data })

  } catch (error) {

    res.status(500).json({ error: 'An error occurred while creating user..' })

  }



}

exports.updateRecentChats = async (req, res) => {
  const _id = req.body._id;
  const senderId = req.body.senderId;
  const chat = req.body.chat;
  const flag = req.body.flag;
  const content = req.body.content;

  try {
    // First, remove the chat from the recentChats array if it exists
    await userModel.findByIdAndUpdate(
      _id,
      {
        $pull: { recentChats: { _id: chat._id } },
      },
      { useFindAndModify: false }
    );

    // Then, add the chat to the beginning of the recentChats array
    await userModel.findByIdAndUpdate(
      _id,
      {
        $push: { recentChats: { $each: [chat], $position: 0 } },
      },
      { new: true, useFindAndModify: false }
    );

    if (flag) {
      // Dynamically update unreadMessages using senderId as the key
      const update = {
        $set: {
          [`unreadMessages.${senderId}.lastMsg`]: content, // Set the last message from sender
        },
        $inc: {
          [`unreadMessages.${senderId}.count`]: 1, // Increment unread message count
        },
      };

      // Update unreadMessages for the user
      const data = await userModel.updateOne({ _id }, update);

      console.log(data);  // Log the result of the update
    }

    res.status(200).json({ message: 'Updated recent chats' });
  } catch (error) {
    console.error('Error adding receiver to recent chats:', error);
    res.status(500).json({ error: 'Failed to update recent chats' });
  }
};

exports.clearUnreadMsgsForRecipient = async (req, res) => {
  const _id = req.body.loggedInUserId;
  const senderId=req.body.senderId;
 

  try {

    const update = { $unset: { [`missedMessages.${senderId}`]: "" } };
    const result = await userModel.updateOne({ _id: _id }, update);
    if (result.modifiedCount > 0) {
      res.status(200).json({ message: `Message with ID ${_id} removed from unreadMessages.` });
    }

   
  } catch (error) {
    console.error('Error removing unread msgs for recipient ...', error);
    res.status(500).json({ error: 'Error removing unread msgs for recipient ...' });
  }
};

 
 
exports.loginUser = async (req, res) => {

  try {

    const user = await userModel.findOne({ username: req.body.username, password: req.body.password })

    if (user) {
      res.status(200).json({ message: 'User authenticated...', data: user });
    } else {
      res.status(401).json({ error: 'Invalid username or password' });
    }
  }
  catch (error) {
    res.status(500).json({ error: 'An error occurred while creating user..' })
  }



}

exports.getRecipient = async (req, res) => {
  try {
    const user = await userModel.find({ _id: req.body.userId });

    if (user) {
      res.status(200).json({ user: user[0] });
    } else {
      res.status(401).json({ error: 'Invalid username or password' });
    }
  }
  catch (error) {
    res.status(500).json({ error: 'An error occurred while creating user..' })
  }
}

exports.searchUser = async (req, res) => {
  try {
    if (req.body.username != '') {
      const users = await userModel.find({
        username: {
          $regex: `^${req.body.username}`,
          $options: 'i'
        }
      });
      if (users) {
        res.status(200).json({ message: 'all users', users: users });
      } else {
        res.status(401).json({ error: 'error while getting users...' });
      }
    }


  } catch (error) {

    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'An error occurred while fetching users' });

  }
};

exports.getRecentChats = async (req, res) => {
  try {
    const user = await userModel.findById(req.body._id);
    console.log(user.unreadMsgs)

    // Extract the _ids of users in recentChats
    const recentChatIds = user.recentChats.map(chat => chat._id.toString());

    // Query the userModel to get updated data for users in recentChats
    const updatedRecentChats = await userModel.find({ _id: { $in: recentChatIds } });

    // Sort the results to match the order in recentChatIds
    const sortedRecentChats = recentChatIds.map(id =>
      updatedRecentChats.find(chat => chat._id.toString() === id)
    );

    res.status(200).json({ recentChats: sortedRecentChats, unreadMsgs:user.unreadMsgs });
  } catch (error) {
    console.error('Error fetching recent chats:', error);
    res.status(500).json({ error: 'An error occurred while fetching recent chats.' });
  }
};


exports.getHistory = async (req, res) => {
  try {

    // Fetch recentChats for the main user
const user = await userModel.findById(req.body._id).lean();
const loggedInUserInfo = user;
const recentChats = user.recentChats;

// Iterate through recentChats to get messages for each chat
const chatMessages = await Promise.all(
  recentChats.map(async (chat) => {

    const user = await userModel.findById(chat._id)
    // Find messages where the `sender` or `receiver` matches the `recentChat` user ID
    const previousMessages = await messageModel.find({
      $or: [
        { 'sender._id': req.body._id, 'receiver._id': chat._id },
        { 'sender._id': chat._id, 'receiver._id': req.body._id }
      ]
    }).sort({ _id: 1 }).lean()

    // Return an object containing the recentChat user info and their messages
    return {
      user: user,       // Include user information from `recentChats`
      messages: previousMessages // All messages exchanged with this user
    };

    console.log(chat)
  })
);

// Now `chatMessages` is an array of objects where each object contains:
// - `user`: the recentChat user information
// - `messages`: an array of message documents associated with that user
 res.status(200).json({data:chatMessages, loggedInUserInfo:loggedInUserInfo})

   
  
  } catch (error) {

    console.error('Error fetching recent chats :', error);
    res.status(500).json({ error: 'An error occurred while fetching recent chats...' });

  }
}; 

exports.getPreviousMessages = async (req, res) => {
  try {
    const previousMessages = await messageModel.find({
      $or: [
        { 'sender._id': req.body.senderId, 'receiver._id': req.body.receiverId },
        { 'sender._id': req.body.receiverId, 'receiver._id': req.body.senderId }
      ]
    }).sort({ _id: 1 });

    res.status(200).json({ previousMessages: previousMessages })
  } catch (error) {
    console.error('Error fetching messages:', error);
  }
};

exports.deleteUser = async (req, res) => {
  try {

    const data = await userModel.deleteOne({ _id: req.body._id });
    res.json(data)

  } catch (error) {

    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'An error occurred while fetching users' });

  }
};

exports.updateUser = async (req, res) => {
  try {




    const data = await userModel.updateOne({ name: req.body.name }, { $set: { email: req.body.email, name: req.body.name, password: req.body.password } });
    res.json(data)

  } catch (error) {

    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'An error occurred while fetching users' });

  }
};


