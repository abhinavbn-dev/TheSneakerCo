import { useEffect, useRef, useState } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import "./ProfilePictureUploader.css";

function imageUrl(value) {
  if (!value) return "";
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  // Vite proxies /uploads to the Express server during development.
  // In production, serve /uploads from the same origin or configure a proxy.
  return `/${value.replace(/^\/+/, "")}`;
}

export default function ProfilePictureUploader() {
  const { user, setUser } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const profilePictureSaveVersion = useRef(0);

  useEffect(() => {
    let active = true;
    const versionAtLoad = profilePictureSaveVersion.current;

    api.me()
      .then((data) => {
        if (!active) return;
        const freshUser = data.user || data;
        setUser((current) => ({
          ...(current || {}),
          ...freshUser,
          profilePicture:
            profilePictureSaveVersion.current === versionAtLoad
              ? freshUser.profilePicture ?? current?.profilePicture ?? ""
              : current?.profilePicture ?? freshUser.profilePicture ?? "",
        }));
      })
      .catch((error) => {
        if (active) setMessage(error.message || "Could not load profile picture.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [setUser]);

  useEffect(() => {
    return () => {
      if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMessage("Please choose a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("The image must be 5 MB or smaller.");
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setMessage("Preview ready. Select Save Picture to confirm.");
  }

  async function handleSave() {
    if (!selectedFile || saving) return;

    setSaving(true);
    setMessage("Saving profile picture...");
    profilePictureSaveVersion.current += 1;

    try {
      const result = await api.uploadProfilePicture(selectedFile);
      const freshUser = result.user || {};
      const saved = result.profilePicture || freshUser.profilePicture;

      if (!saved) {
        throw new Error("Server did not return the saved picture path.");
      }

      // Persist the returned profile picture in shared auth state as well
      // as the database response, so it survives page navigation/refresh.
      setUser((current) => ({
        ...(current || user || {}),
        ...freshUser,
        profilePicture: saved,
      }));

      setSelectedFile(null);
      setPreview("");
      setMessage("Profile picture saved successfully.");
    } catch (error) {
      setMessage(error.message || "Could not save profile picture.");
    } finally {
      setSaving(false);
    }
  }

  function cancelSelection() {
    setSelectedFile(null);
    setPreview("");
    setMessage("");
  }

  const savedPicture = user?.profilePicture || "";
  const picture = preview || imageUrl(savedPicture);

  return (
    <section className="profile-picture-uploader">
      <div className="profile-picture-avatar">
        {picture ? (
          <img key={picture} src={picture} alt="Profile" />
        ) : (
          <span>{user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
        )}
      </div>

      <div className="profile-picture-controls">
        <h2>Profile picture</h2>
        <label className="btn-outline profile-picture-choose">
          {selectedFile
            ? "Choose another picture"
            : savedPicture
              ? "Change picture"
              : "Choose picture"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={saving || loading}
            onChange={handleFileChange}
          />
        </label>

        {selectedFile && (
          <div className="profile-picture-actions">
            <button
              type="button"
              className="btn"
              onClick={handleSave}
              disabled={saving || loading}
            >
              {saving ? "Saving..." : "Save picture"}
            </button>
            <button
              type="button"
              className="btn-outline"
              onClick={cancelSelection}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        )}

        {message && (
          <p className="profile-picture-message" role="status">
            {message}
          </p>
        )}
      </div>
    </section>
  );
}
