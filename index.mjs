import express from "express";
import dotenv from "dotenv";
import { dirname } from "path";
import { fileURLToPath } from "url";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import seatRoutes from "./routes/seats.js";
import bookingRoutes from "./routes/bookings.js";
import { migrate } from "./db/migrate.js";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const port = process.env.PORT || 8080;

// Equivalent to mongoose connection
// Pool is nothing but group of connections
// If you pick one connection out of the pool and release it
// the pooler will keep that connection open for sometime to other clients to reuse
const app = new express();
app.use(cors());
app.use(express.json()); // REQUIRED: parses JSON req bodies to req.body

app.get("/", (_, res) => {
  res.sendFile(__dirname + "/index.html");
});
app.use("/src", express.static(__dirname + "/src"));
app.use("/public", express.static(__dirname + "/public"));

//book a seat give the seatId and your name
app.get("/ping", (req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/seats", seatRoutes);
app.use("/bookings", bookingRoutes);


migrate().then(() => {
  app.listen(port, () => console.log(`Server starting on port: ${port}`));
});
