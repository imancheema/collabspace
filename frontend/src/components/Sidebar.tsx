import React, { useState } from "react";
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

const Sidebar: React.FC<SidebarProps> = ({ onSelectGroup }) => {
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [showJoinPopup, setShowJoinPopup] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);

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
        <JoinGroupPopup onClose={() => setShowJoinPopup(false)} />
      )}
    </>
  );
};

export default Sidebar;
export type { Group };
