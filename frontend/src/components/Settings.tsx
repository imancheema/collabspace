import React, { useEffect, useState } from "react";
import "./Settings.css";

type Member = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type SettingsProps = {
  groupCode?: string;
};

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const Settings: React.FC<SettingsProps> = ({ groupCode }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserId(payload.sub);
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (!groupCode) return;

    const fetchMembers = async () => {
      try {
        const res = await fetch(`${API_URL}/groups/${groupCode}/members`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to fetch members");
        }

        const data = await res.json();
        setMembers(data.members);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [groupCode]);

  const handleLeaveGroup = async () => {
    if (!groupCode) return;
    if (!window.confirm("Are you sure you want to leave this group?")) return;

    try {
      const res = await fetch(`${API_URL}/groups/${groupCode}/leave`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to leave group");
      alert("You left the group");
      window.location.href = "/";
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteGroup = async () => {
    if (!groupCode) return;
    if (
      !window.confirm(
        "Are you sure you want to delete this group? This cannot be undone."
      )
    )
      return;

    try {
      const res = await fetch(`${API_URL}/groups/${groupCode}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete group");
      alert("Group deleted successfully");
      window.location.href = "/";
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <p>Fetching the members</p>;
  if (error) return <p>Couldn’t load the members. Try refreshing.</p>;
  if (!members.length)
    return <p>Looks like there’s no one in this group yet.</p>;
  const isAdmin = members.find((m) => m.id === userId)?.role === "admin";

  return (
    <div className="settings-tab">
      <h3>Group Members</h3>
      <table className="members-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id}>
              <td>{member.name}</td>
              <td>{member.email}</td>
              <td>{member.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="settings-actions">
        <button className="settings-btn leave" onClick={handleLeaveGroup}>
          Leave Group
        </button>
        {isAdmin && (
          <button className="settings-btn delete" onClick={handleDeleteGroup}>
            Delete Group
          </button>
        )}
      </div>
    </div>
  );
};

export default Settings;
