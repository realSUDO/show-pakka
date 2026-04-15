import express from "express";
import pool from "../db/pool.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// get all seats - public route

router.get("/", async (req, res) => {
	const result = await pool.query("SELECT * FROM seats");
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

		await conn.query("COMMIT");
		conn.release();

		res.json({ message: "Seat booked successfully", bookedBy: req.user.email });
	} catch (ex) {
		console.error(ex);
		res.status(500).json({ error: "Internal server error" });
	}
});

export default router;
