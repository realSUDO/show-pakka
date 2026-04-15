import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../db/pool.js";
import { authSchema, validate } from "../middleware/validate.js";

const router = express.Router();

// post /auth/register
router.post("/register", validate(authSchema), async (req, res) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json({ error: "Email and password are required" });
		}

		// check if user already exists
		const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
			email,
		]);
		if (existing.rowCount > 0) {
			return res.status(409).json({ error: "Email already in use" });
		}

		// hash the password 
		const hashedPassword = await bcrypt.hash(password, 10);
		const result = await pool.query(
			"INSERT INTO users (email,password) VALUES ($1, $2) RETURNING id, email", [email, hashedPassword]
		);

		const user = result.rows[0];

		// create JWT token
		const token = jwt.sign({
			id: user.id,
			email: user.email
		},
			process.env.JWT_SECRET,
			{ expiresIn: "1d" }
		);

		res.status(201).json({ message: "Registration successful", token });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: " Internal server error" }); // generic error message for any unexpected errors
	}
});

// post /auth/login

router.post("/login", validate(authSchema), async (req, res) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json({
				error: "Email and password are required",
			});
		}
		const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

		if (result.rowCount === 0) {
			return res.status(401).json({ error: "Invalid email or password" });
		}

		const user = result.rows[0];

		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.status(401).json({ error: "Invalid email or password" });
		}

		const token = jwt.sign(
			{ id: user.id, email: user.email },
			process.env.JWT_SECRET,
			{ expiresIn: "1d" }
		);
		res.json({ message: "Login successful", token });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Internal server error" });
	}
})


export default router;
