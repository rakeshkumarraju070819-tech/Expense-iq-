# ExpenseIQ – Full Stack Expense Tracker

Smart Personal Finance & Investment Management

---

## Project Structure

```
expenseiq/
├── backend/                  # Node.js + Express + MongoDB
│   ├── src/
│   │   ├── server.js         # Entry point
│   │   ├── models/
│   │   │   ├── user.model.js
│   │   │   └── expense.model.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── expense.controller.js
│   │   │   └── user.controller.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── expense.routes.js
│   │   │   └── user.routes.js
│   │   └── middleware/
│   │       ├── auth.middleware.js
│   │       └── error.middleware.js
│   ├── .env.example
│   └── package.json
│
└── frontend/                 # React + Vite + Tailwind CSS
    ├── src/
    │   ├── main.jsx          # Entry point
    │   ├── App.jsx           # Routes
    │   ├── index.css         # Tailwind + global styles
    │   ├── api/
    │   │   ├── axios.js      # Axios instance with JWT interceptor
    │   │   ├── auth.api.js   # Auth API calls
    │   │   └── expense.api.js
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── SignUpPage.jsx
    │   │   ├── OTPPage.jsx
    │   │   └── Dashboard.jsx
    │   └── components/
    │       ├── ui.jsx          # Logo, GoogleBtn, OTPInput, PhoneInput etc.
    │       ├── Sidebar.jsx
    │       ├── AddExpenseModal.jsx
    │       └── SpendingChart.jsx
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

---

### Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env — set MONGODB_URI and JWT_SECRET
npm install
npm run dev
# API runs on http://localhost:5000
```

**OTP Integration (optional):**  
In `src/controllers/auth.controller.js`, replace the `sendOTPToPhone` stub with your SMS provider:
- [Twilio](https://twilio.com)
- [Fast2SMS](https://fast2sms.com) (India)
- [MSG91](https://msg91.com) (India)

During development, the OTP is printed to the console.

---

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:3000
```

The Vite dev server proxies `/api` requests to `http://localhost:5000`.

---

### Google OAuth Setup (Production)

1. Create a project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Install `@react-oauth/google` in the frontend
5. Replace the `handleGoogle` mock in `LoginPage.jsx` / `SignUpPage.jsx` with real `useGoogleLogin()` hook
6. Pass the real `googleId`, `name`, `email`, `avatar` to the `/api/auth/google` endpoint

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/send-otp | ❌ | Send OTP to phone |
| POST | /api/auth/verify-otp | ❌ | Verify OTP → get token |
| POST | /api/auth/google | ❌ | Google login/signup |
| GET | /api/auth/me | ✅ | Get current user |
| GET | /api/expenses | ✅ | List expenses (filterable) |
| POST | /api/expenses | ✅ | Create expense |
| PUT | /api/expenses/:id | ✅ | Update expense |
| DELETE | /api/expenses/:id | ✅ | Delete expense |
| DELETE | /api/expenses/all | ✅ | Delete all expenses |
| GET | /api/expenses/summary | ✅ | Monthly/today stats |
| GET | /api/users/profile | ✅ | Get profile |
| PUT | /api/users/profile | ✅ | Update name/budgets |

---

## Tech Stack

**Backend:** Node.js, Express, MongoDB, Mongoose, JWT, bcryptjs  
**Frontend:** React 18, Vite, Tailwind CSS, React Router v6, TanStack Query, Recharts, Axios
