const User = require('../models/User')
const asyncHandler = require('express-async-handler')
const bcrypt = require('bcrypt')

// @desc Get all users
// @route GET /users
// @access Private
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password').lean()
  if (!users?.length) {
    return res.status(400).json({ message: 'No users found' })
  }
  res.json(users)
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

module.exports = {
  getAllUsers,
  createNewUser,
  updateUser,
  deleteUser
}