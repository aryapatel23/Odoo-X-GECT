const { getDB } = require('../../config/db');

exports.addHoliday = async (req, res) => {
  try {
    const db = getDB();
    const { date, reason } = req.body;

    if (!date || !reason) {
      return res.status(400).json({ message: "Date and reason are required" });
    }

    await db.collection('Holidays').insertOne({ date, reason });
    res.status(201).json({ message: "Holiday added successfully" });
  } catch (error) {
    console.error("Error adding holiday:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getHolidays = async (req, res) => {
  try {
    const db = getDB();
    const holidays = await db.collection('Holidays').find({}).toArray();
    res.status(200).json(holidays);
  } catch (error) {
    console.error("Error fetching holidays:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteHoliday = async (req, res) => {
  try {
    const db = getDB();
    const { ObjectId } = require('mongodb');
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Holiday ID is required" });
    }

    const result = await db.collection('Holidays').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 1) {
      res.status(200).json({ message: "Holiday deleted successfully" });
    } else {
      res.status(404).json({ message: "Holiday not found" });
    }
  } catch (error) {
    console.error("Error deleting holiday:", error);
    res.status(500).json({ message: "Server error" });
  }
};
