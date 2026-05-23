"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import type { Address } from "viem";
import { usePost, useHasLiked, useLikePost, useReplies } from "@/hooks/usePosts";
import { useProfile } from "@/hooks/useProfile";
import { PostForm } from "./PostForm";

function formatTimestamp(ts: bigint): string {
  return new Date(Number(ts) * 1000).toLocaleString();
}

function truncateAddress(addr: Address): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

type Props = {
  postId: bigint;
  depth?: number; // prevents infinite nesting in UI (max depth = 2)
};

export function PostCard({ postId, depth = 0 }: Props) {
  const { address } = useAccount();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(depth === 0);

  const { post, refetch: refetchPost } = usePost(postId);
  const { profile } = useProfile(post?.author);
  const { hasLiked, refetch: refetchLike } = useHasLiked(postId, address);
  const { likePost, unlikePost, isPending, isSuccess } = useLikePost();
  const { replyIds, refetch: refetchReplies } = useReplies(postId);

  if (!post) return null;

  if (isSuccess) {
    refetchPost();
    refetchLike();
  }

  const handleLike = () => {
    if (!address) return;
    if (hasLiked) {
      unlikePost(postId);
    } else {
      likePost(postId);
    }
  };

  const handleReplySuccess = () => {
    setShowReplyForm(false);
    setShowReplies(true);
    refetchReplies();
  };

  const authorName = profile?.exists ? profile.username : truncateAddress(post.author);
  const replyCount = replyIds?.length ?? 0;
  const isNested = depth > 0;

  return (
    <div style={{ marginLeft: isNested ? 20 : 0, borderLeft: isNested ? "2px solid var(--border)" : "none", paddingLeft: isNested ? 12 : 0 }}>
      <article style={cardStyle}>
        <div style={headerStyle}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{authorName}</span>
          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
            {formatTimestamp(post.timestamp)}
          </span>
        </div>
        <p style={{ marginTop: 8, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{post.content}</p>
        <div style={footerStyle}>
          <div style={{ display: "flex", gap: 8 }}>
            {/* Like button */}
            <button
              className="btn-ghost"
              onClick={handleLike}
              disabled={!address || address === post.author || isPending}
              style={{
                fontSize: 13,
                padding: "4px 10px",
                color: hasLiked ? "var(--accent)" : undefined,
                borderColor: hasLiked ? "var(--accent)" : undefined,
              }}
            >
              {hasLiked ? "♥" : "♡"} {post.likeCount.toString()}
            </button>
            {/* Reply button */}
            {address && depth < 2 && (
              <button
                className="btn-ghost"
                onClick={() => setShowReplyForm((v) => !v)}
                style={{ fontSize: 13, padding: "4px 10px" }}
              >
                ↩ Reply
              </button>
            )}
            {/* Show/hide replies toggle */}
            {replyCount > 0 && depth < 2 && (
              <button
                className="btn-ghost"
                onClick={() => setShowReplies((v) => !v)}
                style={{ fontSize: 13, padding: "4px 10px" }}
              >
                {showReplies ? "▲" : "▼"} {replyCount} {replyCount === 1 ? "reply" : "replies"}
              </button>
            )}
          </div>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {truncateAddress(post.author)}
          </span>
        </div>
      </article>

      {/* Inline reply form */}
      {showReplyForm && (
        <div style={{ marginTop: -12, marginBottom: 8 }}>
          <PostForm
            parentPostId={postId}
            onSuccess={handleReplySuccess}
            placeholder={`Reply to ${authorName}...`}
          />
        </div>
      )}

      {/* Nested replies */}
      {showReplies && replyIds && replyIds.length > 0 && (
        <div style={{ marginTop: 4, marginBottom: 8 }}>
          {replyIds.map((id) => (
            <PostCard key={id.toString()} postId={id} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: 16,
  marginBottom: 8,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const footerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 12,
};
