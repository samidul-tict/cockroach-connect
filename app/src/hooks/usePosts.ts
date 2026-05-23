"use client";

import { useReadContract, useWriteContract, useChainId, useWaitForTransactionReceipt } from "wagmi";
import { useEffect, useState } from "react";
import type { Address } from "viem";
import { CONTRACT_ADDRESSES, SOCIAL_POST_ABI } from "@/lib/contracts";

export type Post = {
  id: bigint;
  author: Address;
  content: string;
  timestamp: bigint;
  likeCount: bigint;
  parentPostId: bigint; // 0n = top-level post
  exists: boolean;
};

export function usePost(postId: bigint | undefined) {
  const chainId = useChainId();
  const contractAddress = CONTRACT_ADDRESSES[chainId]?.socialPost;

  const { data, isLoading, refetch } = useReadContract({
    address: contractAddress,
    abi: SOCIAL_POST_ABI,
    functionName: "getPost",
    args: postId !== undefined ? [postId] : undefined,
    query: { enabled: postId !== undefined && !!contractAddress },
  });

  return { post: data as Post | undefined, isLoading, refetch };
}

export function useTotalPosts() {
  const chainId = useChainId();
  const contractAddress = CONTRACT_ADDRESSES[chainId]?.socialPost;

  const { data, isLoading } = useReadContract({
    address: contractAddress,
    abi: SOCIAL_POST_ABI,
    functionName: "getTotalPosts",
    query: { enabled: !!contractAddress },
  });

  return { total: data as bigint | undefined, isLoading };
}

export function useUserPosts(userAddress: Address | undefined) {
  const chainId = useChainId();
  const contractAddress = CONTRACT_ADDRESSES[chainId]?.socialPost;

  const { data, isLoading } = useReadContract({
    address: contractAddress,
    abi: SOCIAL_POST_ABI,
    functionName: "getUserPosts",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress && !!contractAddress },
  });

  return { postIds: data as bigint[] | undefined, isLoading };
}

export function useReplies(postId: bigint | undefined) {
  const chainId = useChainId();
  const contractAddress = CONTRACT_ADDRESSES[chainId]?.socialPost;

  const { data, isLoading, refetch } = useReadContract({
    address: contractAddress,
    abi: SOCIAL_POST_ABI,
    functionName: "getReplies",
    args: postId !== undefined ? [postId] : undefined,
    query: { enabled: postId !== undefined && !!contractAddress },
  });

  return { replyIds: data as bigint[] | undefined, isLoading, refetch };
}

export function useHasLiked(postId: bigint | undefined, userAddress: Address | undefined) {
  const chainId = useChainId();
  const contractAddress = CONTRACT_ADDRESSES[chainId]?.socialPost;

  const { data, refetch } = useReadContract({
    address: contractAddress,
    abi: SOCIAL_POST_ABI,
    functionName: "hasLiked",
    args: postId !== undefined && userAddress ? [postId, userAddress] : undefined,
    query: { enabled: postId !== undefined && !!userAddress && !!contractAddress },
  });

  return { hasLiked: data as boolean | undefined, refetch };
}

export function useCreatePost() {
  const chainId = useChainId();
  const contractAddress = CONTRACT_ADDRESSES[chainId]?.socialPost;
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createPost = (content: string, parentPostId: bigint = 0n) => {
    if (!contractAddress) return;
    writeContract({
      address: contractAddress,
      abi: SOCIAL_POST_ABI,
      functionName: "createPost",
      args: [content, parentPostId],
    });
  };

  return { createPost, isPending, isConfirming, isSuccess, error, reset };
}

export function useLikePost() {
  const chainId = useChainId();
  const contractAddress = CONTRACT_ADDRESSES[chainId]?.socialPost;
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });

  const likePost = (postId: bigint) => {
    if (!contractAddress) return;
    writeContract({
      address: contractAddress,
      abi: SOCIAL_POST_ABI,
      functionName: "likePost",
      args: [postId],
    });
  };

  const unlikePost = (postId: bigint) => {
    if (!contractAddress) return;
    writeContract({
      address: contractAddress,
      abi: SOCIAL_POST_ABI,
      functionName: "unlikePost",
      args: [postId],
    });
  };

  return { likePost, unlikePost, isPending, isSuccess };
}

// Fetches all posts by iterating IDs 1..total
// In production this is replaced by The Graph query
export function useRecentPosts(limit = 20) {
  const { total } = useTotalPosts();
  const [postIds, setPostIds] = useState<bigint[]>([]);

  useEffect(() => {
    if (total === undefined) return;
    const ids: bigint[] = [];
    const start = total > BigInt(limit) ? total - BigInt(limit) : BigInt(0);
    for (let i = total; i > start; i--) {
      ids.push(i);
    }
    setPostIds(ids);
  }, [total, limit]);

  return { postIds };
}
