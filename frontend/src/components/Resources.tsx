import React, { useState, useEffect } from "react";
import "./Resources.css";

type ResourcesProps = {
  groupCode?: string;
};

const API_BASE = "http://localhost:5000";

const Resources: React.FC<ResourcesProps> = ({ groupCode }) => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [totalBytes, setTotalBytes] = useState<number>(0);
  const [totalFiles, setTotalFiles] = useState<number>(0);
  const [statsError, setStatsError] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] || null;
    setFile(picked);
    setStatus("");
  };

  const fetchStats = async () => {
    try {
      setStatsError("");

      const url = `${API_BASE}/stats${
        groupCode ? `?groupCode=${encodeURIComponent(groupCode)}` : ""
      }`;

      const resp = await fetch(url);
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        setStatsError(err.error || "Failed to load storage stats.");
        return;
      }

      const data = await resp.json();
      if (data && data.ok) {
        setTotalBytes(
          typeof data.totalSizeBytes === "number" ? data.totalSizeBytes : 0
        );
        setTotalFiles(
          typeof data.totalFiles === "number" ? data.totalFiles : 0
        );
      } else {
        setStatsError("Failed to load storage stats.");
      }
    } catch (err) {
      console.error("Stats fetch error:", err);
      setStatsError("Failed to load storage stats.");
    }
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

      const resp = await fetch(`${API_BASE}/files/upload`, {
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

      await fetchStats();
    } catch (err) {
      console.error(err);
      setStatus("An error occurred while uploading.");
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [groupCode]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = bytes / Math.pow(k, i);
    return `${value.toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className="resources">
      <div className="resources-header">
        <h3>Resources</h3>
        {groupCode && (
          <p className="resources-group-label">For group: {groupCode}</p>
        )}
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

      {status && <p className="resources-status">{status}</p>}

      <div className="resources-stats">
        <h4>Storage Usage</h4>
        {statsError ? (
          <p className="resources-stats-error">{statsError}</p>
        ) : (
          <div className="resources-stats-grid">
            <div className="resources-stats-item">
              <span className="resources-stats-label">Total files</span>
              <span className="resources-stats-value">{totalFiles}</span>
            </div>
            <div className="resources-stats-item">
              <span className="resources-stats-label">Total size</span>
              <span className="resources-stats-value">
                {formatBytes(totalBytes)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Resources;
