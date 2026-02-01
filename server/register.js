// server.js (Node.js/Express File)
// ... (Existing setup: require express, cors, body-parser, etc.)

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); 
const app = express();
const PORT = 5000; 

app.use(cors());
app.use(bodyParser.json());

// --- NEW REGISTRATION ENDPOINT ---
app.post('/register-user', (req, res) => {
    // Extract data sent from the React frontend
    const { 
        uid, 
        email, 
        name, 
        contact, 
        profession 
    } = req.body;
    
    // ⚠️ CRITICAL STEP: Database Interaction
    console.log("--- New User Registration Data Received ---");
    console.log("Firebase UID:", uid);
    console.log("Email:", email);
    console.log("Full Name:", name);
    console.log("Contact:", contact);
    console.log("Profession:", profession);
    
    // In a real application, this is where you connect to your database 
    // (e.g., MongoDB, PostgreSQL, MySQL) and save all this information 
    // to a 'users' collection/table.

    // Example of a basic check
    if (uid && email) {
        // Send a success response back to the frontend
        res.status(201).json({ 
            message: "User registration complete. Profile data saved to backend DB." 
        });
    } else {
        // Send an error response
        res.status(400).json({ 
            message: "Missing required user data (UID or Email)." 
        });
    }
});

// ... (Your existing /api/login and /test-connection endpoints go here)

app.listen(PORT, () => {
    console.log(`Node.js Server running on http://localhost:${PORT}`);
});