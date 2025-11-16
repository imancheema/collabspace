import React, { useState } from "react";
import "./Resources.css";

type ResourcesProps = {
  groupCode?: string;
};

const API_BASE = "http://localhost:5000";

const Resources: React.FC<ResourcesProps> = ({ groupCode }) => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);

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
    } catch (err) {
      console.error(err);
      setStatus("An error occurred while uploading.");
    } finally {
      setIsUploading(false);
    }
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
    </div>
  );
};

export default Resources;
