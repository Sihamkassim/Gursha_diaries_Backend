const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, "Full Name is required"],
    trim: true,
    minLength: [2, "Full Name must be at least 2 characters long"],
    maxLength: [50, "Full Name must be at most 50 characters long"]
  },
  username: {
    type: String,
    required: [true, "Username is required"],
    trim: true,
    unique: [true, "Username must be unique"],
    minLength: [3, "Username must be at least 3 characters long"],
    maxLength: [30, "Username must be at most 30 characters long"]
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    trim: true,
    unique: [true, "Email must be unique"],
    minLength: [5, "Email must be at least 5 characters long"],
    maxLength: [50, "Email must be at most 50 characters long"],
    lowercase: true
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    trim: true,
    select: false // Exclude password from queries by default
  },
  verified: {
    type: Boolean,
    default: false
  },
  verificationCode: {
    type: String,
    select: false
  },
  verificationCodeValidation: {
    type: Number,
    select: false
  },
  forgotPasswordCode: {
    type: String,
    select: false
  },
  forgotPasswordCodeValidation: {
    type: Number,
    select: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("User", userSchema);
