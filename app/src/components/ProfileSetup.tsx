"use client";

import { useState } from "react";
import { useCreateProfile } from "@/hooks/useProfile";

const MAX_USERNAME = 32;
const MAX_BIO = 160;

export function ProfileSetup() {
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const { createProfile, isPending, isConfirming, isSuccess, error } = useCreateProfile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    createProfile(username.trim(), bio.trim());
  };

  if (isSuccess) {
    return (
      <div style={cardStyle}>
        <p style={{ color: "#22c55e" }}>Profile created! Refresh to continue.</p>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <h2 style={{ marginBottom: 16, fontSize: 17 }}>Create your profile</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <input
            type="text"
            placeholder="Username (max 32 chars)"
            value={username}
            onChange={(e) => setUsername(e.target.value.slice(0, MAX_USERNAME))}
            maxLength={MAX_USERNAME}
          />
          <span style={counterStyle}>{username.length}/{MAX_USERNAME}</span>
        </div>
        <div>
          <textarea
            placeholder="Bio (optional, max 160 chars)"
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, MAX_BIO))}
            rows={2}
            maxLength={MAX_BIO}
          />
          <span style={counterStyle}>{bio.length}/{MAX_BIO}</span>
        </div>
        {error && <p className="error">{(error as Error).message}</p>}
        <button
          type="submit"
          className="btn-primary"
          disabled={!username.trim() || isPending || isConfirming}
        >
          {isPending ? "Confirm in wallet..." : isConfirming ? "Creating..." : "Create Profile"}
        </button>
      </form>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: 20,
  marginBottom: 24,
};

const counterStyle: React.CSSProperties = {
  display: "block",
  textAlign: "right",
  fontSize: 12,
  color: "var(--text-muted)",
  marginTop: 4,
};
