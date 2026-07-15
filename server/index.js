import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 4000;

// roomName -> Map<socketId, username>
const rooms = new Map();

function getUsersInRoom(room) {
  return Array.from(rooms.get(room)?.values() || []);
}

app.get("/", (req, res) => {
  res.send("Realtime chat server is running.");
});

io.on("connection", (socket) => {
  let currentRoom = null;
  let currentUser = null;

  socket.on("join_room", ({ room, username }) => {
    // leave previous room if any
    if (currentRoom) {
      socket.leave(currentRoom);
      rooms.get(currentRoom)?.delete(socket.id);
      io.to(currentRoom).emit("user_list", getUsersInRoom(currentRoom));
    }

    currentRoom = room;
    currentUser = username;
    socket.join(room);

    if (!rooms.has(room)) rooms.set(room, new Map());
    rooms.get(room).set(socket.id, username);

    socket.to(room).emit("system_message", `${username} joined the room.`);
    io.to(room).emit("user_list", getUsersInRoom(room));
  });

  socket.on("send_message", ({ room, message, username }) => {
    io.to(room).emit("receive_message", {
      id: `${socket.id}-${Date.now()}`,
      username,
      message,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on("typing", ({ room, username, isTyping }) => {
    socket.to(room).emit("user_typing", { username, isTyping });
  });

  socket.on("disconnect", () => {
    if (currentRoom && rooms.has(currentRoom)) {
      rooms.get(currentRoom).delete(socket.id);
      io.to(currentRoom).emit("user_list", getUsersInRoom(currentRoom));
      if (currentUser) {
        socket.to(currentRoom).emit("system_message", `${currentUser} left the room.`);
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Chat server listening on port ${PORT}`);
});
