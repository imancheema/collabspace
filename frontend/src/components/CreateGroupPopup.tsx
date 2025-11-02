import React, { useState } from "react";
import "./CreateGroupPopup.css";

interface CreateGroupPopupProps {
  onClose: () => void;
}

const CreateGroupPopup: React.FC<CreateGroupPopupProps> = ({ onClose }) => {
  const [groupCode, setGroupCode] = useState("");

  const generateCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setGroupCode(code);
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <h2>Create New Group</h2>
        <form>
          <label>
            Group Name:
            <input type="text" placeholder="Enter group name" />
          </label>
          <label>
            Description:
            <textarea placeholder="Enter group description" />
          </label>
          <button
            type="button"
            className="generate-button"
            onClick={generateCode}
          >
            Generate Group Code
          </button>
          {groupCode && (
            <p className="generated-code">Your Code: {groupCode}</p>
          )}

          <div className="popup-buttons">
            <button type="submit">Create Group</button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupPopup;
