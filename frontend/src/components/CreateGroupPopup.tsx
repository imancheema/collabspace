import React, { useState } from "react";
import "./CreateGroupPopup.css";

interface CreateGroupPopupProps {
  onClose: () => void;
  onGroupCreated: (group: {
    name: string;
    description: string;
    code: string;
  }) => void;
}

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const CreateGroupPopup: React.FC<CreateGroupPopupProps> = ({
  onClose,
  onGroupCreated,
}) => {
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupCode, setGroupCode] = useState("");

  const generateCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setGroupCode(code);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName || !groupCode) return;

    const token = localStorage.getItem("token");
    if (!token) {
      console.error("You must be logged in to create a group");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/groups/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: groupName,
          description: groupDescription,
          code: groupCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Failed to create group:", data.error);
        return;
      }

      onGroupCreated({
        name: groupName,
        description: groupDescription,
        code: groupCode,
      });
      setGroupName("");
      setGroupDescription("");
      setGroupCode("");
      onClose();
    } catch (err) {
      console.error("Network or server error:", err);
    }
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <h2>Create new group</h2>
        <form onSubmit={handleCreate}>
          <label>
            Group Name:
            <input
              type="text"
              placeholder="Enter group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </label>
          <label>
            Description:
            <textarea
              placeholder="Enter group description"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
            />
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
