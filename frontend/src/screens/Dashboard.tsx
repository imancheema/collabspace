import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar, { Group } from "../components/Sidebar";
import "./Dashboard.css";

interface StoredUser {
  id?: number;
  name?: string;
  email?: string;
}

const Dashboard: React.FC = () => {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return;

      const parsed: StoredUser = JSON.parse(raw);
      const displayName = parsed.name || parsed.email || null;
      setUserName(displayName);
    } catch {
      setUserName(null);
    }
  }, []);

  return (
    <div className="dashboard">
      <Navbar />
      <div className="dashboard-layout">
        <Sidebar onSelectGroup={setSelectedGroup} />
        <main className="dashboard-main">
          <div className="dashboard-main-header">
            <h2>Dashboard</h2>
            {userName && (
              <p className="dashboard-greeting">
                Welcome back, <span>{userName}</span> 👋
              </p>
            )}
          </div>

          {selectedGroup ? (
            <div className="group-detail">
              <h2>{selectedGroup.name}</h2>
              <p>{selectedGroup.description || "No description provided."}</p>
              <button
                className="enter-group-btn"
                onClick={() => console.log(`Entering ${selectedGroup.name}`)}
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
