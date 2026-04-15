import { z } from "zod";

export const authSchema = z.object({
	email: z.string().email("Invalid email address"),
	password: z.string().min(6, "Password must be at least 6 characters long"),
});

// Middleware factory . . takes zod schema and returns an express middleware function

export function validate(schema) {
	return (req, res, next) => {
		try {
			const result = schema.safeParse(req.body);
			if (!result.success) {
				const errors = result.error.issues.map((err) => ({
					field: err.path.join("."),
					message: err.message,
				}));
				return res.status(400).json({ errors });
			}
			req.body = result.data;
			next();
		} catch (err) {
			console.error("Validation error:", err);
			res.status(500).json({ error: "Internal Server Error" });
		}
	};
}
