import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar, { Group } from "../components/Sidebar";
import "./Dashboard.css";

const Dashboard: React.FC = () => {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  return (
    <div className="dashboard">
      <Navbar />
      <div className="dashboard-layout">
        <Sidebar onSelectGroup={setSelectedGroup} />
        <main className="dashboard-main">
          <h2>Dashboard</h2>
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
