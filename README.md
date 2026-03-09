# 🏎️ TypeRacing — Real-Time Multiplayer Typing Race

A full-stack multiplayer typing race web application built with React, Node.js, Socket.IO, and MySQL.

## 📋 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Real-time | Socket.IO |
| Database | MySQL |
| Auth | JWT + bcrypt |

---

## 🚀 Getting Started (Local Development)

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- npm or yarn

---

### 1. Clone & Setup Database

```bash
# Start MySQL and create the database
mysql -u root -p < database/schema.sql
```

This creates the `typeracing` database with all tables and seed data.

---

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your MySQL credentials
nano .env
```

Your `backend/.env` should look like:
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=typeracing
JWT_SECRET=change_this_to_a_long_random_string
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

```bash
# Start the backend server
npm run dev
# Server runs on http://localhost:5000
```

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Default .env works for local development

# Start the frontend dev server
npm run dev
# App runs on http://localhost:5173
```

---

## 🎮 Features

### Multiplayer Race
1. Login and go to **Race**
2. Create a race room (choose difficulty + language)
3. Share the **Room Code** with friends
4. Friends join using the code
5. Click **Start Race** to begin countdown
6. All players type the same text in real-time
7. Live progress bars show everyone's position
8. First to finish wins! 🏆

### Practice Mode
- Solo typing practice
- Choose difficulty: Easy / Medium / Hard
- Choose language: English / Coding / Urdu
- See WPM, accuracy, and time after finishing

### Leaderboard
- Global top 20 rankings
- Ranked by best WPM
- Shows accuracy and total races

### User Profile
- Stats overview (best WPM, accuracy, total races)
- Race history
- Visual progress bars

---

## 📁 Project Structure

```
typeracing/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── TypingArea.jsx       ← Core typing interface
│   │   │   ├── PlayerProgress.jsx  ← Live race progress bars
│   │   │   ├── CountdownOverlay.jsx
│   │   │   ├── RaceResults.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Race.jsx            ← Full multiplayer race
│   │   │   ├── Practice.jsx
│   │   │   ├── Leaderboard.jsx
│   │   │   ├── Profile.jsx
│   │   │   └── NotFound.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── services/
│   │   │   └── api.js              ← Axios instance
│   │   ├── socket/
│   │   │   └── socket.js           ← Socket.IO client
│   │   ├── App.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── backend/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── raceController.js
│   │   └── leaderboardController.js
│   ├── models/
│   │   └── db.js                   ← MySQL connection pool
│   ├── routes/
│   │   ├── auth.js
│   │   ├── user.js
│   │   ├── race.js
│   │   └── leaderboard.js
│   ├── sockets/
│   │   └── raceSocket.js           ← Socket.IO race logic
│   ├── middleware/
│   │   └── auth.js                 ← JWT middleware
│   └── server.js
│
└── database/
    └── schema.sql                  ← Full DB schema + seed data
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Create account |
| POST | `/api/login` | Get JWT token |

### User
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile` | Get user stats |
| GET | `/api/race-history` | Get race history |

### Race
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/race/create` | Create race room |
| POST | `/api/race/join` | Join race by code |
| GET | `/api/race/result` | Get race results |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leaderboard` | Top 20 players |
| GET | `/api/practice-text` | Random practice text |

---

## ⚡ Socket.IO Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `joinRace` | `{ raceId, roomCode }` | Join a race room |
| `startRace` | `{ raceId }` | Start the race (host) |
| `playerProgress` | `{ raceId, progress, wpm, accuracy }` | Send typing progress |
| `playerFinished` | `{ raceId, wpm, accuracy, finishTime }` | Player finished |
| `leaveRace` | `{ raceId }` | Leave the race |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `raceJoined` | `{ text, players, status }` | Joined successfully |
| `playerJoined` | `{ player, players }` | New player joined |
| `playerLeft` | `{ userId, players }` | Player left |
| `countdown` | `{ seconds }` | Countdown tick |
| `raceStarted` | `{ startTime }` | Race began |
| `progressUpdate` | `{ userId, progress, wpm, accuracy }` | Player progress |
| `playerFinishedRace` | `{ userId, position, wpm, accuracy }` | Player finished |
| `raceFinished` | `{ results }` | All players done |

---

## 🚀 Deployment

### Frontend → Vercel

```bash
cd frontend
npm run build
# Deploy the /dist folder to Vercel
# Set environment variables:
# VITE_API_URL=https://your-backend.onrender.com/api
# VITE_SOCKET_URL=https://your-backend.onrender.com
```

### Backend → Render

1. Connect your GitHub repo to Render
2. Root directory: `backend`
3. Build command: `npm install`
4. Start command: `node server.js`
5. Set environment variables in Render dashboard:
   - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
   - `JWT_SECRET`
   - `CLIENT_URL` = your Vercel URL
   - `NODE_ENV=production`

### Database → PlanetScale / Railway / AWS RDS

Import `database/schema.sql` to your cloud MySQL instance.

---

## 🔐 Security Features

- **bcrypt** password hashing (12 rounds)
- **JWT** authentication with 7-day expiry
- **Input validation** via express-validator
- **CORS** protection with whitelist
- SQL injection protection via parameterized queries

---

## 🎨 Design Features

- Dark modern UI with custom design system
- Real-time character-by-character highlighting (green/red)
- Animated countdown overlay
- Live progress bars for all racers
- Smooth animations and transitions
- Responsive design (mobile-friendly)
- Custom scrollbar and selection styles

---

## 📝 License

MIT — Free to use and modify.
"# Typeracing" 
