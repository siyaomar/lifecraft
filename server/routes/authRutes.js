
const express = require("express");
const router = express.Router();

// Test route
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  console.log("Login request:", email, password);

  // Dummy response (no DB yet)
  if (email && password) {
    return res.json({ message: "Backend login working ✅", email });
  }
  return res.status(400).json({ error: "Missing fields" });
});

module.exports = router;
