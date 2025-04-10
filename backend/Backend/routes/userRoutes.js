const express = require('express')
const router = express.Router()
const userController = require('../controllers/usersController')
const User = require('../models/User')

router.route('/')
  .post(userController.createNewUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser)
  router.post('/login', userController.loginUser);

  router.post('/room', userController.userRoom);

  router.post('/username', async (req, res) => {
    const { email } = req.body;
  
    // Validate email
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
  
    try {
      // Find user by email
      const user = await User.findOne({ email });
  
      // If user not found
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Return username
      return res.status(200).json({ username: user.username });
    } catch (error) {
      console.error('Error fetching username:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
module.exports = router
