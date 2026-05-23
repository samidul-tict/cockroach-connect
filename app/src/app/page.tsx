"use client";

import { useAccount } from "wagmi";
import { ConnectButton } from "@/components/ConnectButton";
import { PostForm } from "@/components/PostForm";
import { PostFeed } from "@/components/PostFeed";
import { ProfileSetup } from "@/components/ProfileSetup";
import { useProfile } from "@/hooks/useProfile";

export default function Home() {
  const { address, isConnected } = useAccount();
  const { profile, isLoading } = useProfile(address);

  return (
    <main style={{ maxWidth: 600, margin: "0 auto", padding: "24px 16px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>CockroachConnect</h1>
        <ConnectButton />
      </header>

      {isConnected && !isLoading && !profile?.exists && (
        <ProfileSetup />
      )}

      {isConnected && profile?.exists && (
        <PostForm />
      )}

      <PostFeed />
    </main>
  );
}
