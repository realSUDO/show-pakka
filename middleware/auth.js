import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {
	const authHeader = req.headers["authorization"];

	// token must be sent as authoraization.. bearer <token>
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.status(401).json({
			error: "Acces denied. No token provided",
		});
	}

	const token = authHeader.split(" ")[1]; // split the string and get the token part

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.user = decoded; // attach decoded user info req
		next(); // hands off control to next route handler
	} catch (err) {
		return res.status(401).json({
			error: "Invalid token",
		});
	}
};

export { verifyToken };
