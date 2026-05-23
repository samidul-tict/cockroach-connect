"use client";

import { useRecentPosts, useTotalPosts } from "@/hooks/usePosts";
import { PostCard } from "./PostCard";

export function PostFeed() {
  const { total, isLoading } = useTotalPosts();
  const { postIds } = useRecentPosts(20);

  if (isLoading) {
    return <p style={{ color: "var(--text-muted)", textAlign: "center", padding: 32 }}>Loading posts...</p>;
  }

  if (!total || total === BigInt(0)) {
    return (
      <div style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>
        <p>No posts yet.</p>
        <p style={{ fontSize: 13, marginTop: 8 }}>Be the first to post on the blockchain.</p>
      </div>
    );
  }

  return (
    <section>
      {postIds.map((id) => (
        <PostCard key={id.toString()} postId={id} />
      ))}
    </section>
  );
}
