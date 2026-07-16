'use strict';

const Reflection = require('../models/Reflection');
const logger = require('../utils/logger');

exports.addReflection = async (req, res, next) => {
  try {
    const { date, mood } = req.body;
    // NOTE: reflection note content is intentionally NOT logged — it is private
    // user data and must never appear in server logs.

    if (!date) return res.status(400).json({ error: "Date is required." });

    let reflection = await Reflection.findOne({ user: req.user.id, date });

    if (reflection) {
      const { note } = req.body; // read here, not in destructure at top
      reflection.mood = mood !== undefined ? mood : reflection.mood;
      reflection.note = note !== undefined ? note : reflection.note;
      await reflection.save();
    } else {
      const { note } = req.body;
      reflection = new Reflection({
        user: req.user.id,
        date,
        mood: mood || 'none',
        note: note || '',
      });
      await reflection.save();
    }

    logger.info({ reqId: req.id, userId: req.user.id, date }, "Reflection saved");
    res.json({ message: "Reflection saved", reflection });
  } catch (error) {
    logger.error({ reqId: req.id, err: error }, "Error saving reflection");
    next(error);
  }
};

exports.getReflections = async (req, res, next) => {
  try {
    const reflections = await Reflection.find({ user: req.user.id })
      .sort({ date: -1 })
      .limit(30);
    res.json(reflections);
  } catch (error) {
    logger.error({ reqId: req.id, err: error }, "Error fetching reflections");
    next(error);
  }
};

exports.getReflectionForDate = async (req, res, next) => {
  try {
    const { date } = req.params;
    const reflection = await Reflection.findOne({ user: req.user.id, date });
    res.json(reflection || null);
  } catch (error) {
    logger.error({ reqId: req.id, err: error }, "Error fetching reflection for date");
    next(error);
  }
};
