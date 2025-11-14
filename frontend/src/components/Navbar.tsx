import React from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";

type NavbarProps = {
  onSignOut?: () => void;
};

const Navbar: React.FC<NavbarProps> = ({ onSignOut }) => {
  const navigate = useNavigate();

  const handleSignOut = () => {

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    if (onSignOut) {
      onSignOut();
    }

    navigate("/", { replace: true });
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

      <button
        type="button"
        className="navbar-signout"
        onClick={handleSignOut}
      >
        Sign Out
      </button>
    </nav>
  );
};

export default Navbar;
