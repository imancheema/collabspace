import React, { useState, useEffect } from "react";
import CreateGroupPopup from "./CreateGroupPopup";
import JoinGroupPopup from "./JoinGroupPopup";
import "./Sidebar.css";

interface SidebarProps {
  onSelectGroup: (group: Group) => void;
}

interface Group {
  name: string;
  description?: string;
  code: string;
}

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const Sidebar: React.FC<SidebarProps> = ({ onSelectGroup }) => {
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [showJoinPopup, setShowJoinPopup] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    const fetchGroups = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch(`${API_URL}/groups/my`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (res.ok) {
          setGroups(data.groups);
        } else {
          console.error("Failed to fetch groups:", data.error);
        }
      } catch (err) {
        console.error("Network error fetching groups:", err);
      }
    };

    fetchGroups();
  }, []);

  const handleGroupCreated = (group: Group) => {
    setGroups((prev) => [...prev, group]);
  };
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
          <button
            className="sidebar-btn"
            onClick={() => setShowJoinPopup(true)}
          >
            Join
          </button>
        </div>
        {showCreatePopup && (
          <CreateGroupPopup
            onClose={() => setShowCreatePopup(false)}
            onGroupCreated={handleGroupCreated}
          />
        )}

        <div className="sidebar-course">
          {groups.length === 0 ? (
            <p className="course-empty">No groups yet</p>
          ) : (
            groups.map((group, idx) => (
              <div
                key={idx}
                className="course-card"
                onClick={() => onSelectGroup(group)}
              >
                {group.name}
              </div>
            ))
          )}
        </div>
      </aside>

      {showJoinPopup && (
        <JoinGroupPopup
          onClose={() => setShowJoinPopup(false)}
          onGroupJoined={(group: Group) =>
            setGroups((prev) => [...prev, group])
          }
        />
      )}
    </>
  );
};

export default Sidebar;
export type { Group };
