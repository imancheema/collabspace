import React, { useState } from "react";
import { Link } from "react-router-dom";

import { useParams, useLocation } from "react-router-dom";
import "./CourseSpace.css";
import Navbar from "../components/Navbar";
import Announcements from "../components/Announcements";
import Resources from "../components/Resources";
import Settings from "../components/Settings";

type CourseSpaceProps = {
  onSignOut?: () => void;
};

const CourseSpace: React.FC<CourseSpaceProps> = ({ onSignOut }) => {
  const { groupCode } = useParams();
  const location = useLocation();
  const { groupName } = location.state || { groupName: "Course Space" };

  const [activeTab, setActiveTab] = useState("announcements");

  return (
    <>
      <Navbar onSignOut={onSignOut} />
      <div className="course-page">
        <Link to="/" className="back-link">
          Back to Dashboard
        </Link>
        <h1>{groupName}</h1>
        <h2>Group Code: {groupCode}</h2>

        <div className="course-container-wrapper">
          <div className="tabs-header">
            {["announcements", "resources", "settings"].map((tab) => (
              <div
                key={tab}
                className={`tab ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </div>
            ))}
          </div>

          <div className="course-container">
            {activeTab === "announcements" && (
              <Announcements groupCode={groupCode || ""}/>
            )}
            {activeTab === "resources" && (
              <Resources groupCode={groupCode || ""} />
            )}
            {activeTab === "settings" && (
              <Settings groupCode={groupCode || ""} />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CourseSpace;
