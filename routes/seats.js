import express from "express";
import pool from "../db/pool.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// GET /seats?movie_id=1 — public
router.get("/", async (req, res) => {
  const { movie_id } = req.query;
  const result = movie_id
    ? await pool.query("SELECT * FROM seats WHERE movie_id = $1 ORDER BY id", [movie_id])
    : await pool.query("SELECT * FROM seats ORDER BY id");
  res.send(result.rows);
});

router.put("/:id/:name", verifyToken, async (req, res) => {
	try {
		const { id, name } = req.params;

		const conn = await pool.connect();
		await conn.query("BEGIN");

		// FOR UPDATE locks this row so no other transaction can book it simultaneously

		const sql = "SELECT * FROM seats WHERE id = $1 AND isbooked = 0 FOR UPDATE";
		const sqlU = "UPDATE seats SET isbooked = 1, name = $2 WHERE id = $1"

		const result = await conn.query(
			sql,[id],
		);

		if (result.rowCount === 0) {
			await conn.query("ROLLBACK");
			conn.release();
			return res.status(409).json({ error: "Seat already booked" });
		}
		await conn.query(sqlU, [
			id,
			name,
		]);
		// record in bookings table
		await conn.query(
			"INSERT INTO bookings (user_id, seat_id, name, movie_id) VALUES ($1, $2, $3, $4)",
			[req.user.id, id, name, req.query.movie_id || null]
		);

		await conn.query("COMMIT");
		conn.release();

		res.json({ message: "Seat booked successfully", bookedBy: req.user.email });
	} catch (ex) {
		console.error(ex);
		res.status(500).json({ error: "Internal server error" });
	}
});

export default router;
