# 🚀 Hackathon Starter Boilerplate (MERN + MVC)

A clean, modular, and rapid-prototyping template prepared with full **Authentication (JWT + bcrypt)**, **MVC Architecture**, and pre-built **Navbar & Footer UI Components**.

---

## 📁 Project Structure

```text
Hackathon/
├── Backened/                  # Express + Node.js API (MVC Architecture)
│   ├── config/
│   │   └── db.js              # MongoDB Connection configuration
│   ├── controllers/
│   │   └── authController.js  # Register, Login & GetMe controllers
│   ├── middleware/
│   │   └── authMiddleware.js  # JWT Token verification middleware
│   ├── models/
│   │   └── User.js            # Mongoose User Schema
│   ├── routes/
│   │   └── authRoutes.js      # Auth API endpoints
│   ├── .env                   # Environment variables (PORT, MONGO_URI, JWT_SECRET)
│   ├── .env.example
│   ├── package.json
│   └── server.js              # Express app entrypoint
│
└── Frontened/                 # React 19 + Vite (Modern Dark Theme UI)
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx     # Responsive Navbar with Auth states
    │   │   ├── Navbar.css
    │   │   ├── Footer.jsx     # Modern Footer with status indicators
    │   │   ├── Footer.css
    │   │   └── ProtectedRoute.jsx # Route guard for logged-in users
    │   ├── context/
    │   │   └── AuthContext.jsx # Global user auth state & functions
    │   ├── pages/
    │   │   ├── Home.jsx       # Landing page
    │   │   ├── Home.css
    │   │   ├── Login.jsx      # Login page
    │   │   ├── Register.jsx   # Register page
    │   │   ├── Auth.css
    │   │   ├── Dashboard.jsx  # Protected Dashboard & Hackathon Canvas
    │   │   └── Dashboard.css
    │   ├── services/
    │   │   └── api.js         # Fetch client with auto-attached JWT headers
    │   ├── App.jsx            # React Router setup
    │   ├── index.css          # Design system & utility styles
    │   └── main.jsx
    └── vite.config.js
```

---

## ⚡ Quick Start Commands

### 1. Start the Backend
Open a terminal in the `Backened/` folder:
```powershell
cd Backened
npm run dev
# Server will run on: http://localhost:5000
```

### 2. Start the Frontend
Open a second terminal in the `Frontened/` folder:
```powershell
cd Frontened
npm run dev
# Frontend will run on: http://localhost:5173
```

---

## 🔐 Auth API Endpoints

| Method | Endpoint | Description | Auth Required? |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | API Status & Endpoint list | No |
| `POST` | `/api/auth/register` | Register new user (name, email, password) | No |
| `POST` | `/api/auth/login` | Login user & receive JWT token | No |
| `GET` | `/api/auth/me` | Fetch currently logged in user | Yes (`Bearer <token>`) |

---

## 🛠️ Tomorrow's Hackathon Checklist: Adding New Features

When you get your hackathon problem statement tomorrow, follow these 4 simple steps to add new features:

1. **New Model:** Create `Backened/models/YourFeature.js`
2. **New Controller:** Create `Backened/controllers/yourFeatureController.js`
3. **New Routes:** Create `Backened/routes/yourFeatureRoutes.js` and mount it in `Backened/server.js` (`app.use('/api/feature', featureRoutes)`)
4. **New Frontend Page:** Create `Frontened/src/pages/YourFeature.jsx` and add `<Route path="/your-feature" element={<YourFeature />} />` in `Frontened/src/App.jsx`.
