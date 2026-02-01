const express = require("express");
const router = express.Router();
const Query = require("../models/Query");

router.post("/submit-query", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }

    const newQuery = new Query({ name, email, subject, message });
    await newQuery.save();

    res.json({ success: true, message: "Query submitted successfully" });

  } catch (err) {
    console.error("❌ Error saving query:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

module.exports = router;
