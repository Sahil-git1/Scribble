const User = require('../models/User')
const asyncHandler = require('express-async-handler')
const bcrypt = require('bcrypt')

// @desc Get all users
// @route GET /users
// @access Private
const loginUser = asyncHandler(async (req, res) => 
  {
    const { email, password } = req.body 
  
    // Validate input
    if (!email || !password ) {
      return res.status(400).json({ message: 'Username, current password, and new password are required' })
    }
  
    // Find the user
    const user = await User.findOne({ email }).exec()
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
  
    // Verify current password
    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      return res.status(401).json({ message: 'Incorrect password' })
    }
    
    res.json({ message: `Success` })
  })


// @desc Create new user
// @route POST /users
// @access Private
const createNewUser = asyncHandler(async (req, res) => {
  const { username, password, email } = req.body 

  // Validate input
  if (!username || !password || !email) {
    return res.status(400).json({ message: 'All fields are required' })
  }

  // Check for duplicate username
  const duplicate = await User.findOne({ username }).lean().exec()
  if (duplicate) {
    return res.status(409).json({ message: 'Duplicate Username' })
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const userObject = { username, 'password': hashedPassword, email }

  const user = await User.create(userObject)
  if (user) {
    res.status(201).json({ message: `New user ${username} created` })
  } else {
    res.status(400).json({ message: "Invalid user data received" })
  }
})

// @desc Update a user's password
// @route PATCH /users
// @access Private
const updateUser = asyncHandler(async (req, res) => {
  const { username, password, newPassword } = req.body 

  // Validate input
  if (!username || !password || !newPassword) {
    return res.status(400).json({ message: 'Username, current password, and new password are required' })
  }

  // Find the user
  const user = await User.findOne({ username }).exec()
  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }

  // Verify current password
  const match = await bcrypt.compare(password, user.password)
  if (!match) {
    return res.status(401).json({ message: 'Incorrect password' })
  }

  // Hash and update the new password
  user.password = await bcrypt.hash(newPassword, 10)
  
  // Save the updated user
  const updatedUser = await user.save()
  res.json({ message: `Password updated for ${updatedUser.username}` })
})

// @desc Delete a user
// @route DELETE /users
// @access Private
const deleteUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body 

  // Validate input
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' })
  }

  // Find the user
  const user = await User.findOne({ username }).exec()
  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }

  // Verify password
  const match = await bcrypt.compare(password, user.password)
  if (!match) {
    return res.status(401).json({ message: 'Incorrect password' })
  }

  // Delete the user  
  const result = await user.deleteOne()
  const reply = `Username ${result.username} with ID ${result._id} deleted`
  res.json({ message: reply })
})

const userRoom = asyncHandler(async (req, res) => {
  const { email, Id } = req.body;

  if (!email || !Id) {
    return res.status(400).json({ message: 'Username and Id are required' });
  }

  console.log('Received data:', req.body); // Debug

  const user = await User.findOne({ email }).exec()

  if (user) {
    user.roomId = Id;
    await user.save();
    return res.status(200).json({ message: 'Room updated successfully' });
  } else {
    return res.status(404).json({ message: 'User not found' });
  }
});



module.exports = {
  loginUser,
  createNewUser,
  updateUser,
  deleteUser,
  userRoom
}