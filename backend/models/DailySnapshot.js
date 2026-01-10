const mongoose = require("mongoose");

const DailySnapshotSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD (IST)
    burnoutRisk: { type: Number, required: true },
    totalCommits: { type: Number, required: true },
    lateNightPercentage: { type: Number, required: true },
    weekendPercentage: { type: Number, required: true },
    confidence: { type: String, enum: ["Low", "Medium", "High"], required: true },
  },
  { timestamps: true }
);

// Ensure 1 snapshot per user per day
DailySnapshotSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("DailySnapshot", DailySnapshotSchema);
