# Blog Backend (Node.js + Express + MongoDB)

REST API for user registration, login and blog creation, secured with JWT.

## Setup
```bash
npm install
cp .env.example .env     # then edit MONGO_URI and JWT_SECRET
npm run dev
```
Server runs at `http://localhost:5000`.

## API Endpoints
| Method | Endpoint             | Auth   | Body                          |
|--------|----------------------|--------|-------------------------------|
| POST   | /api/auth/register   | No     | name, email, password         |
| POST   | /api/auth/login      | No     | email, password               |
| POST   | /api/blogs           | Bearer | title, content                |
| GET    | /api/blogs           | No     | -                             |

Send the token as: `Authorization: Bearer <token>`

## Connecting the frontend
```js
const API = "http://localhost:5000/api";

// Register
const res = await fetch(`${API}/auth/register`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name, email, password }),
});
const data = await res.json();
localStorage.setItem("token", data.token);

// Create blog
await fetch(`${API}/blogs`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
  body: JSON.stringify({ title, content }),
});
```
