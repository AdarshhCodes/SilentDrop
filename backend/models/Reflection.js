const mongoose = require("mongoose");

const reflectionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String, // format: YYYY-MM-DD
    required: true
  },
  mood: {
    type: String,
    enum: ['flow', 'okay', 'stressed', 'none'],
    default: 'none'
  },
  note: {
    type: String,
    maxlength: 200,
    default: ""
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Reflection", reflectionSchema);
