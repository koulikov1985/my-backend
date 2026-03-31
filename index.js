const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Test route
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// Fake login route
app.post("/login", (req, res) => {
  const { username } = req.body;

  res.json({
    message: "Login successful",
    user: username
  });
});

// Subscription check route
app.get("/check-subscription", (req, res) => {
  res.json({
    active: true
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
