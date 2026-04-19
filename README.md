# Show Pakka!!!

A full-stack movie ticket booking platform with JWT authentication, per-movie seat maps, and a dark cinematic UI.

![Stack](https://img.shields.io/badge/Node.js-Express-green) ![DB](https://img.shields.io/badge/PostgreSQL-raw%20SQL-blue) ![Auth](https://img.shields.io/badge/Auth-JWT-orange)

---

## Features

- Browse movies with poster art
- Theatre-style seat map (70 seats per movie, rows A–G)
- Select up to 4 seats per booking
- JWT authentication — register or login before booking
- Booking form with a name field per seat
- My Bookings screen with movie poster + booking history
- Keep-alive ping to prevent Render free tier spin-down

---

## Tech Stack

| Layer | Tech |
|---|---|
| Backend | Node.js, Express v5 |
| Database | PostgreSQL (raw SQL via `pg`) |
| Auth | JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`) |
| Validation | Zod |
| Frontend | Vanilla JS, Lucide icons, Inter font |
| Dev DB | Docker |

---

## Project Structure

```
show-pakka/
├── db/
│   ├── pool.js          # PostgreSQL connection pool
│   └── schema.sql       # All table definitions + seed data
├── middleware/
│   ├── auth.js          # JWT verification middleware
│   └── validate.js      # Zod request validation
├── routes/
│   ├── auth.js          # POST /auth/register, POST /auth/login
│   ├── seats.js         # GET /seats, PUT /seats/:id/:name
│   └── bookings.js      # GET /bookings
├── src/
│   ├── script.js        # Frontend SPA logic
│   └── style.css        # All styles
├── public/
│   └── assets/          # Movie poster images
├── index.html           # App shell (4 screens)
├── index.mjs            # Express entry point
├── .env.example         # Environment variable template
├── DEPLOY.md            # Render deployment guide
└── docker-compose.yml   # Local PostgreSQL
```

---

## Local Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd show-pakka
npm install
```

### 2. Start PostgreSQL with Docker

```bash
docker compose up -d
```

### 3. Create tables and seed data

```bash
docker exec -i book-my-ticket-db psql -U postgres -d sql_class_2_db -f db/schema.sql
```

### 4. Configure environment

```bash
cp .env.example .env
# Edit .env with your values
```

`.env` values:

```
DB_HOST=localhost
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=sql_class_2_db
JWT_SECRET=your_secret_here
PORT=8080
```

### 5. Start the server

```bash
npm start
# or for auto-reload:
npm run dev
```

Open `http://localhost:8080`

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/ping` | No | Health check |
| GET | `/seats?movie_id=1` | No | Get seats for a movie |
| POST | `/auth/register` | No | Register + receive JWT |
| POST | `/auth/login` | No | Login + receive JWT |
| PUT | `/seats/:id/:name?movie_id=1` | Yes | Book a seat |
| GET | `/bookings` | Yes | Get user's booking history |

### Auth flow

```bash
# Register
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com", "password": "pass123"}'

# Book a seat (use token from above)
curl -X PUT "http://localhost:8080/seats/1/YourName?movie_id=1" \
  -H "Authorization: Bearer <token>"
```

---

## Database Schema

```sql
users    — id, email, password, created_at
seats    — id, movie_id, name, isbooked
bookings — id, user_id, seat_id, movie_id, name, booked_at
```
