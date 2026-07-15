# 💬 Realtime Chat App

A full-stack real-time chat application with rooms, live messaging, typing indicators, and an online users list — built with **React**, **Node.js**, **Express**, and **Socket.io**.

## Features
- 🔴 Live messaging via WebSockets (Socket.io)
- 🏠 Multiple chat rooms — join any room by name
- ⌨️ Real-time typing indicators
- 👥 Live online users list per room
- 🔔 System messages (user joined / left)

## Tech Stack
| Layer      | Technology              |
|------------|--------------------------|
| Frontend   | React (Vite)             |
| Backend    | Node.js, Express          |
| Real-time  | Socket.io                 |
| Styling    | Plain CSS                 |

## Project Structure
```
realtime-chat-app/
├── server/          # Node.js + Socket.io backend
│   ├── index.js
│   └── package.json
└── client/          # React frontend (Vite)
    ├── src/
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    └── package.json
```

## Getting Started

### 1. Start the backend
```bash
cd server
npm install
npm start
```
Server runs on `http://localhost:4000`

### 2. Start the frontend
```bash
cd client
npm install
npm run dev
```
App runs on `http://localhost:5173`

### 3. Chat
Open the app in two browser tabs, join the same room with different names, and start chatting.

## Deployment
- **Backend** → Deploy to [Render](https://render.com) or [Railway](https://railway.app) (free tier works well for Socket.io)
- **Frontend** → Deploy to [Vercel](https://vercel.com). Set the environment variable `VITE_SERVER_URL` to your deployed backend URL.

## Roadmap Ideas
- Message persistence with MongoDB/PostgreSQL
- Private 1:1 messaging
- User authentication
- Message reactions/emojis

---
Built by [Shodhan S](https://github.com/Shodhans77)
