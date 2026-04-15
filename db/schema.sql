-- Book My Ticket — Database Schema
-- Run this file to set up all tables from scratch
-- Usage: psql -U <user> -d <database> -f db/schema.sql

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id         SERIAL PRIMARY KEY,
    email      VARCHAR(255) UNIQUE NOT NULL,
    password   VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Seats table (movie_id scopes seats per movie)
CREATE TABLE IF NOT EXISTS seats (
    id       SERIAL PRIMARY KEY,
    movie_id INT NOT NULL DEFAULT 1,
    name     VARCHAR(255),
    isbooked INT DEFAULT 0
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id        SERIAL PRIMARY KEY,
    user_id   INT NOT NULL REFERENCES users(id),
    seat_id   INT NOT NULL REFERENCES seats(id),
    movie_id  INT DEFAULT 1,
    name      VARCHAR(255) NOT NULL,
    booked_at TIMESTAMP DEFAULT NOW()
);

-- Seed: 70 seats per movie (movies 1, 2, 3 are mocked in frontend)
-- Only run if seats table is empty
INSERT INTO seats (movie_id, isbooked)
SELECT m.id, 0
FROM generate_series(1, 3) AS m(id)
CROSS JOIN generate_series(1, 70)
WHERE NOT EXISTS (SELECT 1 FROM seats LIMIT 1);
