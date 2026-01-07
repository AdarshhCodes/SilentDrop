const mongoose = require("mongoose");

const commitSchema = new mongoose.Schema({
  userId: {
    type: String, //Github ID
    ref: "User",
    required: true,
  },
  commitDate: {
    type: Date,
    required: true,
  },
  commitCount: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("Commit", commitSchema);
