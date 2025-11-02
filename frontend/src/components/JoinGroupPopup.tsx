import React, { useState } from "react";
import "./CreateGroupPopup.css";

interface JoinGroupPopupProps {
  onClose: () => void;
}

const JoinGroupPopup: React.FC<JoinGroupPopupProps> = ({ onClose }) => {
  const [groupCode, setGroupCode] = useState("");

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Joining group with code:", groupCode);
    onClose();
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

          <div className="popup-buttons">
            <button type="submit">Join</button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinGroupPopup;
