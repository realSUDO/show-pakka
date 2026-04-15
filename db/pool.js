import pg from "pg";
import dotenv from "dotenv";


dotenv.config();

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 20, // max num of connection in pool
  connectionTimeoutMillis: 0,
  idleTimeoutMillis: 0,
});

export default pool;


