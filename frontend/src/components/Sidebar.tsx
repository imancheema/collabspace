import React, { useState } from "react";
import CreateGroupPopup from "./CreateGroupPopup";
import JoinGroupPopup from "./JoinGroupPopup";
import "./Sidebar.css";

const Sidebar: React.FC = () => {
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [showJoinPopup, setShowJoinPopup] = useState(false);

  return (
    <>
      <aside className="sidebar">
        <h2 className="sidebar-title">My groups</h2>
        <p className="sidebar-subtitle">Create, join, or open a group</p>

        <div className="sidebar-btn-group">
          <button
            className="sidebar-btn"
            onClick={() => setShowCreatePopup(true)}
          >
            Create
          </button>
          <button
            className="sidebar-btn"
            onClick={() => setShowJoinPopup(true)}
          >
            Join
          </button>
        </div>

        <div className="sidebar-course">
          <p className="course-code">ECE1779</p>
        </div>
      </aside>
      {showCreatePopup && (
        <CreateGroupPopup onClose={() => setShowCreatePopup(false)} />
      )}

      {showJoinPopup && (
        <JoinGroupPopup onClose={() => setShowJoinPopup(false)} />
      )}
    </>
  );
};

export default Sidebar;
