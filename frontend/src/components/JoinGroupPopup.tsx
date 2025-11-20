import React, { useState } from "react";
import "./CreateGroupPopup.css";

interface JoinGroupPopupProps {
  onClose: () => void;
  onGroupJoined: (group: {
    name: string;
    description?: string;
    code: string;
  }) => void;
}

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const JoinGroupPopup: React.FC<JoinGroupPopupProps> = ({
  onClose,
  onGroupJoined,
}) => {
  const [groupCode, setGroupCode] = useState("");
  const [error, setError] = useState("");

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be logged in to join a group");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/groups/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ groupCode }),
      });

      const data = await res.json();
      if (res.ok) {
        onGroupJoined(data.group);
        onClose();
      } else {
        setError(data.error || "Could not join group");
      }
    } catch (err) {
      setError("Network error joining group");
    }
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <h2>Join Group</h2>
        <form onSubmit={handleJoin}>
          <label>
            Group Code:
            <input
              type="text"
              placeholder="Enter group code"
              value={groupCode}
              onChange={(e) => setGroupCode(e.target.value)}
            />
          </label>
          {error && <p className="error-text">{error}</p>}
          <div className="popup-buttons">
            <button type="submit">Join</button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>{" "}
        </form>
      </div>
    </div>
  );
};

export default JoinGroupPopup;
