import pool from "./pool.js";

export async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id         SERIAL PRIMARY KEY,
      email      VARCHAR(255) UNIQUE NOT NULL,
      password   VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS seats (
      id       SERIAL PRIMARY KEY,
      movie_id INT NOT NULL DEFAULT 1,
      name     VARCHAR(255),
      isbooked INT DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id        SERIAL PRIMARY KEY,
      user_id   INT NOT NULL REFERENCES users(id),
      seat_id   INT NOT NULL REFERENCES seats(id),
      movie_id  INT DEFAULT 1,
      name      VARCHAR(255) NOT NULL,
      booked_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Seed 70 seats per movie only if seats table is empty
  const { rowCount } = await pool.query("SELECT 1 FROM seats LIMIT 1");
  if (rowCount === 0) {
    await pool.query(`
      INSERT INTO seats (movie_id, isbooked)
      SELECT m.id, 0
      FROM generate_series(1, 3) AS m(id)
      CROSS JOIN generate_series(1, 70)
    `);
    console.log("Seeded 210 seats (70 per movie)");
  }

  console.log("Database ready");
}
