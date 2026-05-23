"use client";

import { useState, useEffect } from "react";
import { useCreatePost } from "@/hooks/usePosts";

const MAX_LENGTH = 280;

type Props = {
  parentPostId?: bigint;
  onSuccess?: () => void;
  placeholder?: string;
};

export function PostForm({ parentPostId, onSuccess, placeholder }: Props) {
  const [content, setContent] = useState("");
  const { createPost, isPending, isConfirming, isSuccess, error, reset } = useCreatePost();

  useEffect(() => {
    if (isSuccess) {
      setContent("");
      reset();
      onSuccess?.();
    }
  }, [isSuccess, reset, onSuccess]);

  const remaining = MAX_LENGTH - content.length;
  const isOverLimit = remaining < 0;
  const isEmpty = content.trim().length === 0;
  const isReply = parentPostId !== undefined && parentPostId !== 0n;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEmpty || isOverLimit) return;
    createPost(content.trim(), parentPostId ?? 0n);
  };

  return (
    <div style={cardStyle}>
      <form onSubmit={handleSubmit}>
        <textarea
          placeholder={placeholder ?? (isReply ? "Write a reply..." : "What's on your mind?")}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={isReply ? 2 : 3}
          style={{ borderColor: isOverLimit ? "var(--danger)" : undefined }}
          autoFocus={isReply}
        />
        <div style={footerStyle}>
          <span style={{ color: isOverLimit ? "var(--danger)" : remaining <= 20 ? "#f59e0b" : "var(--text-muted)", fontSize: 13 }}>
            {remaining}
          </span>
          {error && <p className="error" style={{ flex: 1, textAlign: "center" }}>{(error as Error).message}</p>}
          <button
            type="submit"
            className="btn-primary"
            disabled={isEmpty || isOverLimit || isPending || isConfirming}
          >
            {isPending ? "Confirm..." : isConfirming ? (isReply ? "Replying..." : "Posting...") : (isReply ? "Reply" : "Post")}
          </button>
        </div>
      </form>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: 16,
  marginBottom: 24,
};

const footerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 10,
  gap: 12,
};
