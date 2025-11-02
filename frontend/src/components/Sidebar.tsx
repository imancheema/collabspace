import React from "react";
import "./Sidebar.css";

const Sidebar: React.FC = () => {
  return (
    <aside className="sidebar">
      <h2 className="sidebar-title">My groups</h2>
      <p className="sidebar-subtitle">Create, join, or open a group</p>

      <div className="sidebar-btn-group">
        <button className="sidebar-btn">Create</button>
        <button className="sidebar-btn">Join</button>
      </div>

      <div className="sidebar-course">
        <p className="course-code">ECE1779</p>
      </div>
    </aside>
  );
};

export default Sidebar;
