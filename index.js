require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const Stripe = require('stripe');

const app = express();
app.use(cors());
app.use(express.json());

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // for Render
});

const PORT = process.env.PORT || 3000;

// ================= Routes ==================

// Test route
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// Register user & generate license key
app.post("/register", async (req, res) => {
  const { email, plan } = req.body;
  if (!email || !plan) return res.status(400).json({ error: "Email and plan required" });

  try {
    const licenseKey = uuidv4(); // generate unique key
    let expiresAt = new Date();
    if (plan === "monthly") expiresAt.setMonth(expiresAt.getMonth() + 1);
    if (plan === "weekly") expiresAt.setDate(expiresAt.getDate() + 7);

    const result = await pool.query(
      "INSERT INTO users (email, license_key, plan, expires_at, active) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [email, licenseKey, plan, expiresAt, true]
    );

    res.json({ message: "User registered", license_key: licenseKey, expires_at: expiresAt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Check license key
app.post("/check-license", async (req, res) => {
  const { license_key } = req.body;
  if (!license_key) return res.status(400).json({ error: "License key required" });

  try {
    const result = await pool.query("SELECT * FROM users WHERE license_key = $1", [license_key]);
    if (result.rows.length === 0) return res.json({ valid: false });

    const user = result.rows[0];
    const now = new Date();
    const valid = user.active && new Date(user.expires_at) > now;

    res.json({ valid, expires_at: user.expires_at });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Stripe webhook (optional)
app.post("/stripe-webhook", express.raw({ type: 'application/json' }), async (req, res) => {
  // Add Stripe webhook handling here if needed
  res.sendStatus(200);
});

// ================= Start Server ==================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
