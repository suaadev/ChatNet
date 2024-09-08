import React, { useState, useEffect } from "react";
import SeeUser from "./SeeUser.jsx";
import { socket } from "../socket.js";
import "../styles/TypeNameUser/typeNameUser.css";

function TypeNameUser() {
  const [inputValue, setInputValue] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [currentUsername, setCurrentUsername] = useState("");

  const handleInputChange = (event) => {
    const cleanValue = event.target.value.replace(/[^a-zA-Z0-9_-]/g, "");
    if (cleanValue.length <= 16) {
      setInputValue(cleanValue);
      if (errorMessage) setErrorMessage("");
    }
  };

  const handleJoin = (e) => {
    if (e) e.preventDefault();
    const username = inputValue.trim();
    if (!username) {
      return setErrorMessage("Please enter a username.");
    }
    if (username.length < 2) {
      return setErrorMessage("Username must be at least 2 characters.");
    }

    setIsLoading(true);
    setErrorMessage("");

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("new_user", { username });

    // Safety timeout in case backend is offline or unreachable
    setTimeout(() => {
      setIsLoading((loading) => {
        if (loading) {
          setErrorMessage(
            "Could not connect to server. Please verify backend is running on port 5000."
          );
          return false;
        }
        return false;
      });
    }, 4000);
  };

  useEffect(() => {
    const handleInfoMessage = (data) => {
      setIsLoading(false);
      if (data.status !== 200) {
        setErrorMessage(data.message || "Failed to join. Try again.");
        return;
      }

      if (data.tkn) {
        window.sessionStorage.setItem("tkn", data.tkn);
        window.sessionStorage.setItem("username", inputValue.trim());
      }
      setCurrentUsername(inputValue.trim());
      setIsJoined(true);
    };

    const handleConnectError = () => {
      setIsLoading(false);
      setErrorMessage(
        "Connection error: Cannot reach WebSocket server at http://localhost:5000"
      );
    };

    socket.on("info_message", handleInfoMessage);
    socket.on("connect_error", handleConnectError);

    return () => {
      socket.off("info_message", handleInfoMessage);
      socket.off("connect_error", handleConnectError);
    };
  }, [inputValue]);

  if (isJoined) {
    return <SeeUser inputValue={currentUsername} />;
  }

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <div className="brand-logo">#</div>
          <h2>ChatNet</h2>
          <p>Real-time channel messaging</p>
        </div>

        <form onSubmit={handleJoin} className="login-form">
          <label htmlFor="username-input">Choose a handle</label>
          <input
            id="username-input"
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="e.g. dev_alex"
            autoFocus
            autoComplete="off"
            spellCheck="false"
          />

          {errorMessage && <div className="error-banner">{errorMessage}</div>}

          <button
            type="submit"
            disabled={isLoading || inputValue.trim().length === 0}
            className="btn-join"
          >
            {isLoading ? "Connecting..." : "Enter Chat"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default TypeNameUser;
