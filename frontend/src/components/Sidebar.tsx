import React, { useState } from "react";
import CreateGroupPopup from "./CreateGroupPopup";
import "./Sidebar.css";

const Sidebar: React.FC = () => {
  const [showCreatePopup, setShowCreatePopup] = useState(false);

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
          <button className="sidebar-btn">Join</button>
        </div>

        <div className="sidebar-course">
          <p className="course-code">ECE1779</p>
        </div>
      </aside>
      {showCreatePopup && (
        <CreateGroupPopup onClose={() => setShowCreatePopup(false)} />
      )}
    </>
  );
};

export default Sidebar;
