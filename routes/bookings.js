import express from "express";
import pool from "../db/pool.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// GET /bookings — logged-in user's bookings
router.get("/", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.id, b.seat_id, b.name, b.booked_at, b.movie_id, s.id as seat_number
       FROM bookings b JOIN seats s ON b.seat_id = s.id
       WHERE b.user_id = $1 ORDER BY b.booked_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
