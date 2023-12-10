import React, { useEffect, useState, useRef } from "react";
import "../styles/chats/chats.css";
import { socket } from "../socket.js";

function ChatView({ username, currentRoom, clear, setClear, colorUser }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef(null);

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || !currentRoom) return;

    const tkn = window.sessionStorage.getItem("tkn");
    socket.emit("send-message-to-room", {
      toRoom: currentRoom,
      username,
      colorUser,
      text,
      tkn,
    });
    setInputText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getTimeString = () => {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    if (clear) {
      setMessages([]);
      setClear(false);
    }

    const onMessage = (msg) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          username: msg.username,
          colorUser: msg.colorUser,
          text: msg.text,
          time: getTimeString(),
          type: "message",
        },
      ]);
    };

    const onUserPresence = (info) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          username: info.username,
          colorUser: info.colorUser,
          type: info.type,
          time: getTimeString(),
        },
      ]);
    };

    socket.on("received_message", onMessage);
    socket.on("user_leave_room", onUserPresence);
    socket.on("user_entered_room", onUserPresence);

    return () => {
      socket.off("received_message", onMessage);
      socket.off("user_leave_room", onUserPresence);
      socket.off("user_entered_room", onUserPresence);
    };
  }, [clear, setClear]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-container">
      <header className="chat-topbar">
        <div className="topbar-left">
          <span className="channel-hash">#</span>
          <h2 className="channel-title">{currentRoom || "Select channel"}</h2>
        </div>
        <div className="topbar-right">
          <span className="status-indicator">
            <span className="dot"></span> Connected
          </span>
        </div>
      </header>

      <div className="messages-viewport">
        {messages.length === 0 ? (
          <div className="empty-room-placeholder">
            <div className="empty-hash">#</div>
            <h3>Welcome to #{currentRoom}</h3>
            <p>This is the start of the #{currentRoom} channel. Say hello!</p>
          </div>
        ) : (
          messages.map((item) => {
            if (item.type === "message") {
              const isOwn = item.username === username;
              return (
                <div
                  key={item.id}
                  className={`message-item ${isOwn ? "is-own" : ""}`}
                >
                  <div
                    className="msg-avatar"
                    style={{ backgroundColor: item.colorUser }}
                  >
                    {item.username ? item.username.charAt(0).toUpperCase() : "?"}
                  </div>
                  <div className="msg-content">
                    <div className="msg-header">
                      <span
                        className="msg-author"
                        style={{ color: item.colorUser }}
                      >
                        {item.username}
                      </span>
                      <span className="msg-time">{item.time}</span>
                    </div>
                    <div className="msg-bubble">{item.text}</div>
                  </div>
                </div>
              );
            } else {
              return (
                <div key={item.id} className="presence-event">
                  <span className="presence-tag">
                    <strong style={{ color: item.colorUser }}>
                      @{item.username}
                    </strong>{" "}
                    {item.type === "entered_user" && "joined the channel"}
                    {item.type === "leave_user" && "left the channel"}
                    {item.type === "disconnect_user" && "disconnected"}
                  </span>
                </div>
              );
            }
          })
        )}
        <div ref={scrollRef} />
      </div>

      <footer className="chat-input-area">
        <form onSubmit={handleSendMessage} className="input-form-wrapper">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              currentRoom
                ? `Message #${currentRoom}...`
                : "Select a channel to chat..."
            }
            disabled={!currentRoom}
            className="chat-input"
            autoFocus
          />
          <button
            type="submit"
            disabled={!inputText.trim() || !currentRoom}
            className="btn-send"
          >
            Send
          </button>
        </form>
      </footer>
    </div>
  );
}

export default ChatView;
