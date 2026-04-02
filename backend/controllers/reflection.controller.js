const Reflection = require('../models/Reflection');

exports.addReflection = async (req, res) => {
  try {
    const { date, mood, note } = req.body;
    
    // date should be 'YYYY-MM-DD'
    if (!date) return res.status(400).json({ error: "Date is required." });

    // Upsert the reflection for the day
    let reflection = await Reflection.findOne({ user: req.user._id, date });
    
    if (reflection) {
      reflection.mood = mood !== undefined ? mood : reflection.mood;
      reflection.note = note !== undefined ? note : reflection.note;
      await reflection.save();
    } else {
      reflection = new Reflection({
        user: req.user._id,
        date,
        mood: mood || 'none',
        note: note || ''
      });
      await reflection.save();
    }

    res.json({ message: "Reflection saved", reflection });
  } catch (error) {
    console.error("Error saving reflection:", error);
    res.status(500).json({ error: "Server error saving reflection" });
  }
};

exports.getReflections = async (req, res) => {
  try {
    // Optionally we can get for a specific month or week later
    const reflections = await Reflection.find({ user: req.user._id }).sort({ date: -1 }).limit(30);
    res.json(reflections);
  } catch (error) {
    console.error("Error fetching reflections:", error);
    res.status(500).json({ error: "Server error fetching reflections" });
  }
};

exports.getReflectionForDate = async (req, res) => {
  try {
    const { date } = req.params;
    const reflection = await Reflection.findOne({ user: req.user._id, date });
    res.json(reflection || null);
  } catch (error) {
    console.error("Error fetching reflection for date:", error);
    res.status(500).json({ error: "Server error fetching reflection for date" });
  }
};
