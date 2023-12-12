import React, { useEffect, useState, useCallback } from "react";
import "../styles/seeUser/seeUser.css";
import ChatView from "./ChatView";
import generateColorHexadecimal from "../helpers/generateColorHex";
import { socket } from "../socket";

function SeeUser({ inputValue }) {
  const [rooms, setRooms] = useState(["general", "dev", "random"]);
  const [activeRoom, setActiveRoom] = useState("general");
  const [newRoomName, setNewRoomName] = useState("");
  const [clearChat, setClearChat] = useState(false);
  const [userColor] = useState(() => generateColorHexadecimal());

  const joinRoom = useCallback(
    (roomName) => {
      if (!roomName) return;
      const tkn = window.sessionStorage.getItem("tkn");
      socket.emit("join-room", {
        username: inputValue,
        colorUser: userColor,
        name_room: roomName,
        tkn,
      });
    },
    [inputValue, userColor]
  );

  const leaveRoom = useCallback(
    (roomName) => {
      if (!roomName) return;
      const tkn = window.sessionStorage.getItem("tkn");
      socket.emit("leave-room", {
        username: inputValue,
        colorUser: userColor,
        name_room: roomName,
        tkn,
      });
    },
    [inputValue, userColor]
  );

  const handleSelectRoom = (targetRoom) => {
    if (targetRoom === activeRoom) return;
    leaveRoom(activeRoom);
    setClearChat(true);
    setActiveRoom(targetRoom);
    joinRoom(targetRoom);
  };

  const handleCreateRoom = (e) => {
    if (e) e.preventDefault();
    const cleanRoom = newRoomName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (!cleanRoom) return;

    if (!rooms.includes(cleanRoom)) {
      setRooms((prev) => [...prev, cleanRoom]);
    }

    leaveRoom(activeRoom);
    setClearChat(true);
    setActiveRoom(cleanRoom);
    joinRoom(cleanRoom);
    setNewRoomName("");
  };

  useEffect(() => {
    socket.emit("get-rooms");

    const onGetRooms = (data) => {
      const serverRooms = data?.rooms || [];
      if (serverRooms.length > 0) {
        setRooms(serverRooms);
        if (!activeRoom || !serverRooms.includes(activeRoom)) {
          const initial = serverRooms[0];
          setActiveRoom(initial);
          joinRoom(initial);
        }
      }
    };

    const onNewRoom = (data) => {
      if (data?.new_room) {
        setRooms((prev) => (prev.includes(data.new_room) ? prev : [...prev, data.new_room]));
      }
    };

    const onDeleteRoom = (data) => {
      if (data?.name_room) {
        setRooms((prev) => prev.filter((r) => r !== data.name_room));
        if (activeRoom === data.name_room) {
          setActiveRoom("general");
          joinRoom("general");
        }
      }
    };

    socket.on("get-rooms", onGetRooms);
    socket.on("new_room", onNewRoom);
    socket.on("delete_room", onDeleteRoom);

    // Initial join
    joinRoom(activeRoom);

    return () => {
      socket.off("get-rooms", onGetRooms);
      socket.off("new_room", onNewRoom);
      socket.off("delete_room", onDeleteRoom);
    };
  }, [joinRoom, activeRoom]);

  return (
    <div className="chat-layout">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="app-title">
            <span className="app-icon">#</span>
            <span className="app-name">ChatNet</span>
          </div>
          <span className="live-status">
            <span className="live-dot"></span>
            Live
          </span>
        </div>

        <form onSubmit={handleCreateRoom} className="create-room-form">
          <input
            type="text"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            placeholder="New channel..."
            className="input-room"
          />
          <button type="submit" className="btn-add-room" title="Create room">
            +
          </button>
        </form>

        <div className="rooms-container">
          <span className="section-label">Channels</span>
          <div className="rooms-list">
            {rooms.map((room) => (
              <button
                key={room}
                type="button"
                onClick={() => handleSelectRoom(room)}
                className={`room-item ${activeRoom === room ? "active" : ""}`}
              >
                <span className="room-prefix">#</span>
                <span className="room-name">{room}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="user-footer">
          <div className="user-avatar" style={{ backgroundColor: userColor }}>
            {inputValue ? inputValue.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="user-details">
            <span className="user-name">@{inputValue}</span>
            <span className="user-badge">Online</span>
          </div>
        </div>
      </aside>

      <main className="chat-main">
        <ChatView
          username={inputValue}
          currentRoom={activeRoom}
          clear={clearChat}
          setClear={setClearChat}
          colorUser={userColor}
        />
      </main>
    </div>
  );
}

export default SeeUser;
