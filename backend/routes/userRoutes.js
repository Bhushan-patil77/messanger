const express = require('express');
const router = express.Router();
const userController = require('../controllers/userControllers')

router.post('/clearDB', userController.clearDB)
router.post('/searchUser', userController.searchUser)
router.post('/getRecentChats', userController.getRecentChats)
router.post('/getHistory', userController.getHistory)
router.post('/getPreviousMessages', userController.getPreviousMessages)
router.post('/updateRecentChats', userController.updateRecentChats)
router.post('/clearUnreadMsgsForRecipient', userController.clearUnreadMsgsForRecipient)
// router.post('/createUser', userController.createUser)
// router.delete('/deleteUser', userController.deleteUser)
// router.put('/updateUser', userController.updateUser)

router.post('/getRecipient', userController.getRecipient)
router.post('/registerUser', userController.registerUser)
router.post('/loginUser', userController.loginUser)

module.exports = router;     