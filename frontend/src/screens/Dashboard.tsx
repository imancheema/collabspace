import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import Sidebar, { Group } from "../components/Sidebar";
import "./Dashboard.css";

type User = {
  name?: string;
  email?: string;
};

type DashboardProps = {
  onSignOut?: () => void;
};

const Dashboard: React.FC<DashboardProps> = ({ onSignOut }) => {
  const navigate = useNavigate();
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed: User = JSON.parse(stored);
        setUserName(parsed.name || parsed.email || "");
      }
    } catch (err) {
      console.error("Failed to parse user from localStorage:", err);
    }
  }, []);

  return (
    <div className="dashboard">
      <Navbar onSignOut={onSignOut} />
      <div className="dashboard-layout">
        <Sidebar onSelectGroup={setSelectedGroup} />

        <main className="dashboard-main">
          <div className="dashboard-main-header">
            <h2>Dashboard</h2>
            {userName && (
              <p className="dashboard-greeting">
                Welcome back, <span>{userName}</span>
              </p>
            )}
          </div>

          {selectedGroup ? (
            <div className="group-detail">
              <h2>{selectedGroup.name}</h2>
              <p>{selectedGroup.description || "No description provided."}</p>
              <button
                className="enter-group-btn"
                onClick={() => {
                  navigate(`/course/${selectedGroup.code}`, {
                    state: { groupName: selectedGroup.name },
                  });
                }}
              >
                Enter Course Space
              </button>
            </div>
          ) : (
            <div className="dashboard-banner">
              <h3>No course selected yet</h3>
              <p>
                Click on a course from the sidebar to enter its space and start
                collaborating.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
