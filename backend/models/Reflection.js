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

// Supports: find({ user, date }) for single-day lookup and
// find({ user }).sort({ date: -1 }).limit(30) for history queries.
reflectionSchema.index({ user: 1, date: 1 });

module.exports = mongoose.model("Reflection", reflectionSchema);

