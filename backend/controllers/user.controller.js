const User = require('../models/User');

exports.updatePreferences = async (req, res) => {
  try {
    const { timezone, coreHoursStart, coreHoursEnd } = req.body;
    
    // Validate inputs
    if (coreHoursStart < 0 || coreHoursStart > 23 || coreHoursEnd < 0 || coreHoursEnd > 23) {
        return res.status(400).json({ error: "Invalid core hours." });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (timezone) user.preferences.timezone = timezone;
    if (coreHoursStart !== undefined) user.preferences.coreHoursStart = coreHoursStart;
    if (coreHoursEnd !== undefined) user.preferences.coreHoursEnd = coreHoursEnd;

    await user.save();
    
    res.json({ message: "Preferences updated successfully", preferences: user.preferences });
  } catch (error) {
    console.error("Error updating preferences:", error);
    res.status(500).json({ error: "Server error updating preferences" });
  }
};

exports.getPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    // Return preferences or default if not set
    const prefs = user.preferences || { timezone: 'UTC', coreHoursStart: 9, coreHoursEnd: 17 };
    res.json(prefs);
  } catch (error) {
    console.error("Error fetching preferences:", error);
    res.status(500).json({ error: "Server error fetching preferences" });
  }
};
