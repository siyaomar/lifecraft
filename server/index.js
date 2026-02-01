require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
// const bodyParser = require("body-parser");
const cors = require("cors");
const User = require("./models/user");
const queryRoutes = require("./routes/queryRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); 
// app.use(bodyParser.json());
app.use("/api", queryRoutes);

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Atlas Connected Successfully"))
  .catch((err) => console.error("❌ Database Connection Error:", err));


// --------------------------------------------------
// 1️⃣ TEST BACKEND
// --------------------------------------------------
app.post("/test-connection", (req, res) => {
  console.log("Received test connection request from frontend:", req.body);
  res.status(200).json({
    message: "Backend working! Received: " + req.body.test,
  });
});


// --------------------------------------------------
// 2️⃣ SAVE USER (Register / First time login)
// --------------------------------------------------
app.post("/save-user", async (req, res) => {
  try {
    const { name, contact, profession, email, firebaseUid } = req.body;

    console.log("--- New User Data Received ---");
    console.log(req.body);

    if (!firebaseUid || !email) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newUser = new User({ name, contact, profession, email, firebaseUid });
    await newUser.save();

    console.log("✅ User saved successfully:", newUser);
    res.status(200).json({
      message: "User data saved successfully!",
      user: newUser,
    });

  } catch (error) {
    console.error("❌ Error saving user:", error);
    res.status(500).json({ message: "Failed to save user", error: error.message });
  }
});


// --------------------------------------------------
// 3️⃣ GET USER PROFILE (This is what your Profile page needs)
// --------------------------------------------------
app.get("/api/profile/:uid", async (req, res) => {
  try {
    const firebaseUid = req.params.uid;

    const user = await User.findOne({ firebaseUid });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        profileData: null,
      });
    }

    res.status(200).json({
      message: "Profile data retrieved successfully",
      profileData: user,
    });

  } catch (error) {
    console.error("❌ Error fetching profile:", error);
    res.status(500).json({
      message: "Failed to fetch profile",
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

