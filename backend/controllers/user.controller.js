'use strict';

const User = require('../models/User');
const logger = require('../utils/logger');

exports.updatePreferences = async (req, res, next) => {
  try {
    const { timezone, coreHoursStart, coreHoursEnd } = req.body;

    if (coreHoursStart < 0 || coreHoursStart > 23 || coreHoursEnd < 0 || coreHoursEnd > 23) {
      return res.status(400).json({ error: "Invalid core hours." });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (timezone) user.preferences.timezone = timezone;
    if (coreHoursStart !== undefined) user.preferences.coreHoursStart = coreHoursStart;
    if (coreHoursEnd !== undefined) user.preferences.coreHoursEnd = coreHoursEnd;

    await user.save();

    logger.info({ reqId: req.id, userId: req.user.id }, "User preferences updated");
    res.json({ message: "Preferences updated successfully", preferences: user.preferences });
  } catch (error) {
    logger.error({ reqId: req.id, err: error }, "Error updating preferences");
    next(error);
  }
};

exports.getPreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const prefs = user.preferences || { timezone: 'UTC', coreHoursStart: 9, coreHoursEnd: 17 };
    res.json(prefs);
  } catch (error) {
    logger.error({ reqId: req.id, err: error }, "Error fetching preferences");
    next(error);
  }
};
