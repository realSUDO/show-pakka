// ── Mock Movies ──────────────────────────────────────────────────────────────
const MOVIES = [
  { id: 1, title: "Dhurandhar: The Revenge", meta: "2D | Hindi | U/A",   icon: "clapperboard", poster: "/public/assets/dhurandhar-the-revenge.jpg" },
  { id: 2, title: "Stellar Odyssey",          meta: "IMAX | English | A", icon: "rocket",       poster: "/public/assets/stellar.webp" },
  { id: 3, title: "The Last Monsoon",          meta: "2D | Hindi | U/A",  icon: "cloud-rain",   poster: "/public/assets/the-last-monsoon.jpg" },
];

// ── State ─────────────────────────────────────────────────────────────────────
let selectedMovie = null;
let selectedSeats = [];   // array of seat objects { id, row, col, label }
let allSeats = [];
let authCallback = null;  // fn to call after successful login

// ── Helpers ───────────────────────────────────────────────────────────────────
function getToken()  { return localStorage.getItem("token"); }
function getEmail()  { return localStorage.getItem("email"); }
function isLoggedIn(){ return !!getToken(); }

function showToast(msg, duration = 3000) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.style.display = "block";
  setTimeout(() => { t.style.display = "none"; }, duration);
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  window.scrollTo(0, 0);
}

// ── Nav ───────────────────────────────────────────────────────────────────────
function updateNav() {
  const email = getEmail();
  ["nav-user", "nav-user-seats"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (email) { el.textContent = email; el.style.display = "block"; }
    else { el.style.display = "none"; }
  });
  const btn = document.getElementById("nav-auth-btn");
  if (btn) {
    if (isLoggedIn()) { btn.textContent = "Logout"; btn.onclick = logout; }
    else { btn.textContent = "Login"; btn.onclick = openAuthModal; }
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("email");
  updateNav();
}

// ── Movies Screen ─────────────────────────────────────────────────────────────
function renderMovies() {
  const grid = document.getElementById("movies-grid");
  grid.innerHTML = MOVIES.map(m => `
    <div class="movie-card" onclick="selectMovie(${m.id})">
      <div class="movie-poster">
        <img src="${m.poster}" alt="${m.title}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
        <div class="movie-poster-fallback" style="display:none">
          <i data-lucide="${m.icon}" style="width:52px;height:52px;color:var(--text);opacity:0.4"></i>
        </div>
        <div class="movie-poster-overlay"></div>
        <div class="movie-badge">${m.meta.split('|')[0].trim()}</div>
      </div>
      <div class="movie-info">
        <div class="movie-title">${m.title}</div>
        <div class="movie-meta">${m.meta}</div>
        <button class="movie-select-btn">Select Seats</button>
      </div>
    </div>
  `).join("");
  lucide.createIcons();
}

function showMovies() {
  selectedSeats = [];
  showScreen("screen-movies");
  updateNav();
}

// ── Seat Screen ───────────────────────────────────────────────────────────────
async function selectMovie(id) {
  selectedMovie = MOVIES.find(m => m.id === id);
  selectedSeats = [];
  document.getElementById("back-movie-title").textContent = selectedMovie.title;
  showScreen("screen-seats");
  updateNav();
  await loadSeats();
}

async function loadSeats() {
  const map = document.getElementById("seat-map");
  map.innerHTML = `<div style="color:var(--accent);padding:20px">Loading seats...</div>`;
  const res = await fetch(`/seats?movie_id=${selectedMovie.id}`);
  allSeats = await res.json();
  renderSeatMap();
}

function renderSeatMap() {
  const map = document.getElementById("seat-map");
  const ROWS = ["A","B","C","D","E","F","G","H","I","J"];
  const COLS = 12;

  // distribute allSeats across rows (20 seats → first 2 rows of 10, or spread evenly)
  // We'll just lay them out sequentially across the grid
  map.innerHTML = "";

  let seatIndex = 0;
  for (let r = 0; r < ROWS.length && seatIndex < allSeats.length; r++) {
    const row = document.createElement("div");
    row.className = "seat-row";

    const label = document.createElement("div");
    label.className = "row-label";
    label.textContent = ROWS[r];
    row.appendChild(label);

    for (let c = 0; c < COLS && seatIndex < allSeats.length; c++) {
      // aisle gaps after col 4 and col 8
      if (c === 4 || c === 8) {
        const aisle = document.createElement("div");
        aisle.className = "aisle";
        row.appendChild(aisle);
      }

      const seat = allSeats[seatIndex];
      const seatEl = document.createElement("div");
      seatEl.className = "seat" + (seat.isbooked ? " booked" : "");
      seatEl.title = `${ROWS[r]}${c + 1}`;
      seatEl.dataset.id = seat.id;
      seatEl.dataset.label = `${ROWS[r]}${c + 1}`;
      seatEl.innerHTML = seat.isbooked ? `<i data-lucide="x" style="width:12px;height:12px"></i>` : "";

      if (!seat.isbooked) {
        seatEl.addEventListener("click", () => toggleSeat(seat, seatEl, `${ROWS[r]}${c + 1}`));
      }

      row.appendChild(seatEl);
      seatIndex++;
    }

    map.appendChild(row);
  }

  updateBookingBar();
  lucide.createIcons();
}

function toggleSeat(seat, el, label) {
  const idx = selectedSeats.findIndex(s => s.id === seat.id);
  if (idx > -1) {
    selectedSeats.splice(idx, 1);
    el.classList.remove("selected");
  } else {
    if (selectedSeats.length >= 4) {
      showToast("Maximum 4 seats per booking");
      return;
    }
    selectedSeats.push({ ...seat, label });
    el.classList.add("selected");
  }
  updateBookingBar();
}

function updateBookingBar() {
  const count = selectedSeats.length;
  document.getElementById("selected-count").textContent = count;
  document.getElementById("selected-seats-label").textContent =
    count ? selectedSeats.map(s => s.label).join(", ") : "—";
  document.getElementById("book-seats-btn").disabled = count === 0;
}

function onBookSeats() {
  if (!isLoggedIn()) {
    authCallback = openBookingModal;
    openAuthModal();
    return;
  }
  openBookingModal();
}

// ── Booking Form Modal ────────────────────────────────────────────────────────
function openBookingModal() {
  const summary = document.getElementById("booking-seats-summary");
  summary.innerHTML = `Movie: <strong>${selectedMovie.title}</strong> &nbsp;|&nbsp; Seats: <strong>${selectedSeats.map(s => s.label).join(", ")}</strong>`;

  const fields = document.getElementById("name-fields");
  fields.innerHTML = selectedSeats.map((s, i) => `
    <div class="form-group">
      <label class="form-label">${i === 0 ? "Full Name *" : `Name ${i + 1} (Optional)`}</label>
      <input class="form-input dashed" type="text" id="name-${i}"
        placeholder="Enter name for seat ${s.label}"
        ${i === 0 ? "required" : ""} />
    </div>
  `).join("");

  document.getElementById("booking-error").style.display = "none";
  document.getElementById("booking-modal").classList.add("open");
}

function closeBookingModal() {
  document.getElementById("booking-modal").classList.remove("open");
}

async function handleBookingSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById("booking-submit");
  const errEl = document.getElementById("booking-error");
  errEl.style.display = "none";
  btn.disabled = true;
  btn.textContent = "Booking...";

  try {
    const token = getToken();
    const results = [];

    for (let i = 0; i < selectedSeats.length; i++) {
      const seat = selectedSeats[i];
      const nameInput = document.getElementById(`name-${i}`);
      const name = nameInput ? nameInput.value.trim() : "";

      if (i === 0 && !name) {
        errEl.textContent = "Name is required for the first seat.";
        errEl.style.display = "block";
        btn.disabled = false;
        btn.textContent = "Confirm Booking";
        return;
      }

      const bookingName = name || `Guest ${i + 1}`;
      const res = await fetch(`/seats/${seat.id}/${encodeURIComponent(bookingName)}?movie_id=${selectedMovie.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        errEl.textContent = `Seat ${seat.label}: ${data.error}`;
        errEl.style.display = "block";
        btn.disabled = false;
        btn.textContent = "Confirm Booking";
        return;
      }
      results.push({ seat, name: bookingName });
    }

    closeBookingModal();
    showSuccess(results);
  } catch (err) {
    errEl.textContent = "Network error. Try again.";
    errEl.style.display = "block";
    btn.disabled = false;
    btn.textContent = "Confirm Booking";
  }
}

// ── Success Screen ────────────────────────────────────────────────────────────
function showSuccess(results) {
  const bookingId = "BK" + Date.now().toString().slice(-6);
  const details = document.getElementById("success-details");
  details.innerHTML = `
    <div class="success-row"><span>Movie</span><span>${selectedMovie.title}</span></div>
    <div class="success-row"><span>Seats</span><span>${results.map(r => r.seat.label).join(", ")}</span></div>
    <div class="success-row"><span>Names</span><span>${results.map(r => r.name).join(", ")}</span></div>
    <div class="success-row"><span>Booking ID</span><span>${bookingId}</span></div>
    <div class="success-row"><span>Status</span><span style="color:#4CAF50">✓ Confirmed</span></div>
  `;
  selectedSeats = [];
  showScreen("screen-success");
}

// ── My Bookings Screen ────────────────────────────────────────────────────────
async function showMyBookings() {
  if (!isLoggedIn()) {
    authCallback = showMyBookings;
    openAuthModal();
    return;
  }

  showScreen("screen-bookings");
  const list = document.getElementById("bookings-list");
  list.innerHTML = `<div style="color:var(--accent)">Loading...</div>`;

  try {
    const res = await fetch("/bookings", {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const data = await res.json();

    if (!data.length) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon"><i data-lucide="ticket-x" style="width:48px;height:48px;color:var(--accent)"></i></div>
          <p>No bookings yet</p>
          <button class="btn btn-outline" onclick="showMovies()">Browse Movies</button>
        </div>`;
      return;
    }

    list.innerHTML = data.map(b => {
      const movie = MOVIES.find(m => m.id === b.movie_id) || { title: "Unknown Movie", poster: null, icon: "film" };
      return `
      <div class="booking-card">
        <div style="display:flex;gap:14px;align-items:center">
          <div style="width:48px;height:64px;border-radius:6px;overflow:hidden;flex-shrink:0;background:var(--card2)">
            ${movie.poster
              ? `<img src="${movie.poster}" style="width:100%;height:100%;object-fit:cover" />`
              : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center"><i data-lucide="${movie.icon}" style="width:20px;height:20px;color:var(--accent)"></i></div>`
            }
          </div>
          <div style="flex:1">
            <div class="booking-card-title">${movie.title}</div>
            <div class="booking-card-meta">
              <span style="display:flex;align-items:center;gap:4px"><i data-lucide="armchair" style="width:12px;height:12px"></i> Seat #${b.seat_number}</span>
              <span style="display:flex;align-items:center;gap:4px"><i data-lucide="user" style="width:12px;height:12px"></i> ${b.name}</span>
              <span style="display:flex;align-items:center;gap:4px"><i data-lucide="calendar" style="width:12px;height:12px"></i> ${new Date(b.booked_at).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}</span>
            </div>
            <div class="status-badge"><div class="status-dot"></div> Confirmed</div>
          </div>
        </div>
      </div>`;
    }).join("");
    lucide.createIcons();
  } catch (err) {
    list.innerHTML = `<div style="color:#ff6b6b">Failed to load bookings.</div>`;
  }
}

// ── Auth Modal ────────────────────────────────────────────────────────────────
let activeAuthTab = "register";

function openAuthModal() {
  switchAuthTab("register");
  document.getElementById("auth-error").style.display = "none";
  document.getElementById("auth-form").reset();
  document.getElementById("auth-modal").classList.add("open");
  setTimeout(() => document.getElementById("auth-email").focus(), 100);
}

function closeAuthModal() {
  document.getElementById("auth-modal").classList.remove("open");
  authCallback = null;
}

function switchAuthTab(tab) {
  activeAuthTab = tab;
  document.getElementById("tab-register").classList.toggle("active", tab === "register");
  document.getElementById("tab-login").classList.toggle("active", tab === "login");
  document.getElementById("auth-submit").textContent = "Continue";
  const footer = document.getElementById("auth-footer");
  if (footer) footer.style.display = tab === "login" ? "none" : "block";
}

async function handleAuth(e) {
  e.preventDefault();
  const email    = document.getElementById("auth-email").value.trim();
  const password = document.getElementById("auth-password").value;
  const errEl    = document.getElementById("auth-error");
  const btn      = document.getElementById("auth-submit");

  errEl.style.display = "none";
  btn.disabled = true;
  btn.textContent = "Please wait...";

  try {
    const endpoint = activeAuthTab === "register" ? "/auth/register" : "/auth/login";
    const res  = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      const msg = data.error || (data.errors && data.errors[0]?.message) || "Something went wrong";
      errEl.textContent = msg;
      errEl.style.display = "block";
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("email", email);
    updateNav();
    closeAuthModal();

    if (authCallback) {
      const cb = authCallback;
      authCallback = null;
      cb();
    }
  } catch (err) {
    errEl.textContent = "Network error.";
    errEl.style.display = "block";
  } finally {
    btn.disabled = false;
    btn.textContent = "Continue";
  }
}

// ── Keep-alive ────────────────────────────────────────────────────────────────
(function keepAlive() {
  const ping = () => fetch("/ping").catch(() => {});
  ping();
  setInterval(ping, 10 * 60 * 1000);
})();

// ── Init ──────────────────────────────────────────────────────────────────────
renderMovies();
updateNav();
lucide.createIcons();
