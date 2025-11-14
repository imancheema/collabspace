import React from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";

const Navbar: React.FC = () => {
  const navigate = useNavigate();

  const handleSignOut = () => {
  
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <h1 className="navbar-title">CollabSpace</h1>
        <p className="navbar-subtitle">
          <span className="highlight">CollabSpace</span> is a web application
          that helps you manage study groups and collaborate in real time.
        </p>
      </div>

      <button className="navbar-signout" onClick={handleSignOut}>
        Sign Out
      </button>
    </nav>
  );
};

export default Navbar;
