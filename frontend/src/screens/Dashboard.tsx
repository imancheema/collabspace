import React from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import "./Dashboard.css";

const Dashboard: React.FC = () => {
  return (
    <div className="dashboard">
      <Navbar />
      <div className="dashboard-layout">
        <Sidebar />
        <main className="dashboard-main">
          <h2>Dashboard</h2>
          <div className="dashboard-banner">
            <h3>No course selected yet</h3>
            <p>
              Click on a course from the sidebar to enter its space and start
              collaborating.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
