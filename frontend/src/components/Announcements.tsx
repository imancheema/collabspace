import React, { useState, useEffect, FormEvent } from "react";
import "./Announcements.css";

//Announcement data
interface Announcement {
  id: number;
  task: string;
  created_at: string;
  user_id: number;
  user_name: string | null;
}

interface AnnouncementsProps {
  groupCode?: string;
}

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const Announcements: React.FC<AnnouncementsProps> = ({ groupCode }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newTask, setNewTask] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  //Fetch announcements
  useEffect(() => {
    if (!groupCode) {
      setIsLoading(false);
      return;
    }

    const fetchAnnouncements = async () => {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem("token") || "";

      try {
        const response = await fetch(
          `${API_URL}/groups/${groupCode}/announcements`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Failed to fetch announcements");
        }

        const data: Announcement[] = await response.json();
        setAnnouncements(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnouncements();
  }, [groupCode]);

  //New announcement
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTask.trim() || !groupCode) return;

    const token = localStorage.getItem("token") || "";

    try {
      const response = await fetch(
        `${API_URL}/groups/${groupCode}/announcements`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ task: newTask }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to create announcement");
      }

      const newAnnouncement: Announcement = await response.json();

      //Add announcement to list
      setAnnouncements([newAnnouncement, ...announcements]);
      setNewTask(""); // Clear input
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post");
    }
  };

  //Delete announcement
  const handleDelete = async (announcementId: number) => {
    const token = localStorage.getItem("token") || "";

    try {
      const response = await fetch(`${API_URL}/announcements/${announcementId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to delete announcement");
      }

      //Remove announcement from list
      setAnnouncements(
        announcements.filter((a) => a.id !== announcementId)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  
  if (!groupCode) {
    return <div className="announcement-status">Loading group information...</div>;
  }
  //Render component
  return (
    <div className="announcements">
      <h3>Group Announcements</h3>

      <form onSubmit={handleSubmit} className="announcement-form">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a new announcement..."
        />
        <button type="submit">
          Add
        </button>
      </form>

      {error && <div className="announcement-status error">Error: {error}</div>}

      {isLoading && <div className="announcement-status">Loading announcements...</div>}

      {!isLoading && announcements.length === 0 && (
        <div className="announcement-status">No announcements yet!</div>
      )}

      <ul className="announcement-list">
        {announcements.map((ann) => (
          <li key={ann.id} className="announcement-item">
            <div className="announcement-item-content">
              <p>{ann.task}</p>
              <small>
                Posted by {ann.user_name || "Unknown"} on{" "}
                {new Date(ann.created_at).toLocaleDateString()}
              </small>
            </div>
            <button
              onClick={() => handleDelete(ann.id)}
              className="announcement-delete-btn"
              title="Delete announcement"
            >
              &times;
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Announcements;
