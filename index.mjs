import express from "express";
import dotenv from "dotenv";
import { dirname } from "path";
import { fileURLToPath } from "url";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import seatRoutes from "./routes/seats.js";

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

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

//book a seat give the seatId and your name
app.use("/auth",authRoutes);  // mounts: POST /auth/register .. POST /auth/login
app.use("/seats",seatRoutes); // mounts: GET /seats .. PUT /seats/:id/:name


app.listen(port, () => console.log("Server starting on port: " + port));
