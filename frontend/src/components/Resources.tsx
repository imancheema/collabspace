import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { FaFileAlt } from "react-icons/fa";
import { FaRegFileLines } from "react-icons/fa6";
import "./Resources.css";

type ResourcesProps = {
  groupCode?: string;
};

type ResourceObject =
  | {
      type: "file";
      key: string;
      name: string;
      size: number;
      lastModified: string;
      url: string;
    }
  | {
      type: "doc";
      key: string;
      id: number;
      name: string;
      size: null;
      lastModified: null;
    };

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const Resources: React.FC<ResourcesProps> = ({ groupCode }) => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const [resourcesList, setResourcesList] = useState<ResourceObject[]>([]);
  const [groupId, setGroupId] = useState<number | null>(null);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(true);
  const [listError, setListError] = useState<string>("");

  const [showCreateDoc, setShowCreateDoc] = useState<boolean>(false);
  const [newDocName, setNewDocName] = useState<string>("");
  const [isCreatingDoc, setIsCreatingDoc] = useState<boolean>(false);

  const [totalBytes, setTotalBytes] = useState<number | null>(null);
  const [totalFiles, setTotalFiles] = useState<number | null>(null);
  const [statsError, setStatsError] = useState<string>("");
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(false);

  const fetchResources = useCallback(async () => {
    if (!groupCode) {
      setIsLoadingList(false);
      setResourcesList([]);
      setGroupId(null);
      return;
    }

    setIsLoadingList(true);
    setListError("");
    try {
      const resp = await fetch(`${API_URL}/groups/${groupCode}/resources`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Failed to fetch files.");
      }

      const data: { groupId: number; resources: ResourceObject[] } =
        await resp.json();
      setGroupId(data.groupId);
      setResourcesList(data.resources);
    } catch (err: any) {
      console.error(err);
      setListError(err.message || "Could not load files.");
    } finally {
      setIsLoadingList(false);
    }
  }, [groupCode]);

  const fetchStats = useCallback(async () => {
    if (!groupCode) {
      setTotalBytes(null);
      setTotalFiles(null);
      setStatsError("");
      return;
    }

    try {
      setIsLoadingStats(true);
      setStatsError("");

      const resp = await fetch(`${API_URL}/groups/${groupCode}/stats`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load storage stats.");
      }

      const data = await resp.json();

      if (data && data.ok) {
        setTotalBytes(
          typeof data.totalBytes === "number" ? data.totalBytes : 0
        );
        setTotalFiles(
          typeof data.totalFiles === "number" ? data.totalFiles : 0
        );
      } else {
        throw new Error("Failed to load storage stats.");
      }
    } catch (err: any) {
      console.error("Stats fetch error:", err);
      setStatsError(err.message || "Failed to load storage stats.");
      setTotalBytes(null);
      setTotalFiles(null);
    } finally {
      setIsLoadingStats(false);
    }
  }, [groupCode]);

  useEffect(() => {
    fetchResources();
    fetchStats();
  }, [fetchResources, fetchStats]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] || null;
    setFile(picked);
    setStatus("");
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus("Please select a file first.");
      return;
    }

    try {
      setIsUploading(true);
      setStatus("Uploading...");

      const formData = new FormData();
      formData.append("file", file);
      if (groupCode) {
        formData.append("groupCode", groupCode);
      }

      const resp = await fetch(`${API_URL}/files/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: formData,
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        setStatus(err.error || "Upload failed.");
        return;
      }

      setStatus("File uploaded successfully");
      setFile(null);

      await fetchResources();
      await fetchStats();
    } catch (err) {
      console.error(err);
      setStatus("An error occurred while uploading.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateDoc = async () => {
    if (!newDocName.trim()) {
      setStatus("Document name cannot be empty.");
      return;
    }
    if (!groupId) {
      setStatus("Group not loaded. Please refresh.");
      return;
    }

    setIsCreatingDoc(true);
    setStatus("");
    try {
      const resp = await fetch(`${API_URL}/groups/${groupId}/textdocs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({ name: newDocName }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create document.");
      }

      setStatus("Document created successfully!");
      setNewDocName("");
      setShowCreateDoc(false);
      await fetchResources();
    } catch (err: any) {
      console.error(err);
      setStatus(err.message);
    } finally {
      setIsCreatingDoc(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const renderResourceList = () => {
    if (isLoadingList) {
      return <p>Loading files...</p>;
    }
    if (listError) {
      return <p className="resources-status-error">{listError}</p>;
    }
    if (resourcesList.length === 0) {
      return <p>No files or docs have been added to this group yet.</p>;
    }

    return (
      <ul className="resources-file-list">
        {resourcesList.map((res) => (
          <li key={res.key} className="file-list-item">
            {res.type === "file" ? (
              <a
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="file-list-link"
                title={res.name}
              >
                <FaFileAlt className="file-icon" /> {res.name}
              </a>
            ) : (
              <Link
                to={`/group/${groupId}/text-editor/${res.id}`}
                className="file-list-link"
                title={res.name}
              >
                <FaRegFileLines className="file-icon" /> {res.name}
              </Link>
            )}
            <span className="file-list-size">
              {res.type === "file" ? `(${formatFileSize(res.size)})` : ""}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  const renderStats = () => {
    if (!groupCode) {
      return (
        <p className="resources-stats-hint">
          Select a course space to see storage usage.
        </p>
      );
    }

    if (statsError) {
      return <p className="resources-stats-error">{statsError}</p>;
    }

    if (isLoadingStats && totalBytes === null && totalFiles === null) {
      return <p className="resources-stats-hint">Loading storage stats...</p>;
    }

    return (
      <div className="resources-stats-grid">
        <div className="resources-stats-item">
          <span className="resources-stats-label">Total files</span>
          <span className="resources-stats-value">
            {totalFiles !== null ? totalFiles : "-"}
          </span>
        </div>
        <div className="resources-stats-item">
          <span className="resources-stats-label">Total size</span>
          <span className="resources-stats-value">
            {totalBytes !== null ? formatFileSize(totalBytes) : "-"}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="resources">
      <div className="resources-header">
        <h3>Resources</h3>
        {groupCode && (
          <p className="resources-group-label">For group: {groupCode}</p>
        )}
      </div>

      <div className="resources-stats">
        <h4>Storage Usage</h4>
        {renderStats()}
      </div>

      <div className="resources-upload-row">
        <input type="file" onChange={handleFileChange} />
        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || isUploading}
        >
          {isUploading ? "Uploading..." : "Upload"}
        </button>
      </div>

      {!showCreateDoc && (
        <div className="resources-upload-row">
          <button
            type="button"
            onClick={() => {
              setShowCreateDoc(true);
              setStatus("");
            }}
            className="create-doc-button"
          >
            Create Text Doc
          </button>
        </div>
      )}

      {showCreateDoc && (
        <div className="create-doc-form">
          <input
            type="text"
            placeholder="Enter new document name..."
            value={newDocName}
            onChange={(e) => setNewDocName(e.target.value)}
            autoFocus
          />
          <button
            type="button"
            onClick={handleCreateDoc}
            disabled={isCreatingDoc}
          >
            {isCreatingDoc ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowCreateDoc(false);
              setNewDocName("");
            }}
            disabled={isCreatingDoc}
            className="cancel-button"
          >
            Cancel
          </button>
        </div>
      )}

      {status && <p className="resources-status">{status}</p>}

      <div className="resources-list-container">
        <h4>Files & Documents</h4>
        {renderResourceList()}
      </div>
    </div>
  );
};

export default Resources;
