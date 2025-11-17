import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { FaFileAlt } from "react-icons/fa";
import { FaRegFileLines } from "react-icons/fa6";
import "./Resources.css";

type ResourcesProps = {
  groupCode?: string;
};

//Files returned from backend
type ResourceObject = {
  type: 'file';   //Object storage files
  key: string;
  name: string;
  size: number;
  lastModified: string;
  url: string;
} | {
  type: 'doc';    //Collaborative text docs
  key: string;
  id: number;
  name: string;
  size: null;
  lastModified: null;
};;

const API_BASE = "http://localhost:5000";

const Resources: React.FC<ResourcesProps> = ({ groupCode }) => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);

  //States for list of files
  const [resourcesList, setResourcesList] = useState<ResourceObject[]>([]);
  const [groupId, setGroupId] = useState<number | null>(null);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(true);
  const [listError, setListError] = useState<string>("");

  const fetchResources = useCallback(async () => {
    if (!groupCode) {
      setIsLoadingList(false);
      return;
    }

    setIsLoadingList(true);
    setListError("");
    try {
      const resp = await fetch(`${API_BASE}/groups/${groupCode}/resources`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Failed to fetch files.");
      }

      const data: { groupId: number; resources: ResourceObject[] } = await resp.json();
      setGroupId(data.groupId);
      setResourcesList(data.resources);
    } catch (err: any) {
      console.error(err);
      setListError(err.message || "Could not load files.");
    } finally {
      setIsLoadingList(false);
    }
  }, [groupCode]);

  //fetch list of resources on load
  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

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

      await fetchResources();
    } catch (err) {
      console.error(err);
      setStatus("An error occurred while uploading.");
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `(${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]})`;
  };

  const renderResourceList = () => {
    if (isLoadingList) {
      return <p>Loading files...</p>;
    }
    if (listError) {
      return <p className="resources-status-error">{listError}</p>;
    }
    if (resourcesList.length === 0) {
      return <p>No files have been uploaded to this group yet!</p>;
    }

    return (
      <ul className="resources-file-list">
        {resourcesList.map((res) => (
          <li key={res.key} className="file-list-item">
            {res.type === 'file' ? (
              //Object storage file
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
              //Collaborative text edit doc
              <Link
                to={`/group/${groupId}/text-editor/${res.id}`}  //Links to text-editor page
                className="file-list-link"
                title={res.name}
              >
                <FaRegFileLines className="file-icon" /> {res.name}
              </Link>
            )}
            <span className="file-list-size">
              {res.type === 'file' ? formatFileSize(res.size) : ""}
            </span>
          </li>
        ))}
      </ul>
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

      <div className="resources-list-container">
        <h4>Uploaded Files</h4>
        {renderResourceList()}
      </div>
    </div>
  );
};

export default Resources;
