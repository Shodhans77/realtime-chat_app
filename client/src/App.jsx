import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

export default function App() {
  const [socket, setSocket] = useState(null);
  const [joined, setJoined] = useState(false);
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("general");
  const [roomMode, setRoomMode] = useState("join");
  const [connectionError, setConnectionError] = useState("");
  const [copied, setCopied] = useState(false);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [input, setInput] = useState("");
  const [typingUser, setTypingUser] = useState(null);
  const typingTimeout = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const s = io(SERVER_URL);
    setSocket(s);
    s.on("connect_error", () => setConnectionError("Can't reach the chat server. Please try again in a moment."));
    s.on("connect", () => setConnectionError(""));
    return () => s.disconnect();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on("receive_message", (msg) => {
      setMessages((prev) => [...prev, { ...msg, type: "message" }]);
    });

    socket.on("system_message", (text) => {
      setMessages((prev) => [...prev, { id: Date.now(), text, type: "system" }]);
    });

    socket.on("user_list", (list) => setUsers(list));
    socket.on("room_error", (text) => {
      setJoined(false);
      setConnectionError(text);
    });

    socket.on("user_typing", ({ username: who, isTyping }) => {
      setTypingUser(isTyping ? who : null);
    });

    return () => {
      socket.off("receive_message");
      socket.off("system_message");
      socket.off("user_list");
      socket.off("room_error");
      socket.off("user_typing");
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleJoin = (e) => {
    e.preventDefault();
    const cleanName = username.trim();
    const cleanRoom = room.trim().toLowerCase().replace(/\s+/g, "-");
    if (!cleanName || !cleanRoom || !socket?.connected) {
      if (!socket?.connected) setConnectionError("Connecting to the chat server… Please try again shortly.");
      return;
    }
    socket.emit(roomMode === "host" ? "create_room" : "join_room", { room: cleanRoom, username: cleanName });
    setConnectionError("");
    setUsername(cleanName);
    setRoom(cleanRoom);
    setMessages([]);
    setJoined(true);
  };

  const copyInvite = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set("room", room);
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setConnectionError("Copy failed. Share this room name: " + room);
    }
  };

  useEffect(() => {
    const inviteRoom = new URLSearchParams(window.location.search).get("room");
    if (inviteRoom) {
      setRoom(inviteRoom);
      setRoomMode("join");
    }
  }, []);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;
    socket.emit("send_message", { room, message: input, username });
    setInput("");
    socket.emit("typing", { room, username, isTyping: false });
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    if (!socket) return;
    socket.emit("typing", { room, username, isTyping: true });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit("typing", { room, username, isTyping: false });
    }, 1200);
  };

  if (!joined) {
    return (
      <div className="join-screen">
        <form className="join-card" onSubmit={handleJoin}>
          <h1>💬 Realtime Chat</h1>
          <p className="subtitle">Create a room to host, or join friends with a room name</p>
          <div className="room-mode" role="group" aria-label="Room action">
            <button type="button" className={roomMode === "host" ? "selected" : ""} onClick={() => setRoomMode("host")}>Host a room</button>
            <button type="button" className={roomMode === "join" ? "selected" : ""} onClick={() => setRoomMode("join")}>Join a room</button>
          </div>
          <input
            placeholder="Your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            placeholder={roomMode === "host" ? "Choose a room name" : "Room name or invite code"}
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />
          {connectionError && <p className="connection-error" role="alert">{connectionError}</p>}
          <button type="submit" disabled={!socket?.connected}>{socket?.connected ? (roomMode === "host" ? "Create & Host Room" : "Join Room") : "Connecting…"}</button>
        </form>
      </div>
    );
  }

  return (
    <div className="chat-layout">
      <aside className="sidebar">
        <h2>#{room}</h2>
        <button type="button" className="invite-button" onClick={copyInvite}>{copied ? "Invite link copied!" : "Invite friends"}</button>
        <p className="online-label">Online — {users.length}</p>
        <ul>
          {users.map((u, i) => (
            <li key={i}>{u}</li>
          ))}
        </ul>
      </aside>

      <main className="chat-main">
        <div className="messages">
          {messages.map((m) =>
            m.type === "system" ? (
              <div key={m.id} className="system-msg">
                {m.text}
              </div>
            ) : (
              <div
                key={m.id}
                className={`msg ${m.username === username ? "own" : ""}`}
              >
                <div className="msg-meta">
                  <span className="msg-user">{m.username}</span>
                  <span className="msg-time">
                    {new Date(m.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="msg-body">{m.message}</div>
              </div>
            )
          )}
          <div ref={messagesEndRef} />
        </div>

        {typingUser && <div className="typing-indicator">{typingUser} is typing…</div>}

        <form className="message-form" onSubmit={handleSend}>
          <input
            placeholder="Type a message…"
            value={input}
            onChange={handleTyping}
            autoFocus
          />
          <button type="submit">Send</button>
        </form>
      </main>
    </div>
  );
}
