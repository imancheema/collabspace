import React from "react";
import "./Navbar.css";

const Navbar: React.FC = () => {
  return (
    <nav className="navbar">
      <div className="navbar-content">
        <h1 className="navbar-title">CollabSpace</h1>
        <p className="navbar-subtitle">
          <span className="highlight">CollabSpace</span> is a web application
          that helps you manage study groups and collaborate in real time.
        </p>
      </div>
    </nav>
  );
};

export default Navbar;
