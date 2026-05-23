"use client";

import { useReadContract, useWriteContract, useChainId, useWaitForTransactionReceipt } from "wagmi";
import type { Address } from "viem";
import { CONTRACT_ADDRESSES, SOCIAL_PROFILE_ABI } from "@/lib/contracts";

export function useProfile(address: Address | undefined) {
  const chainId = useChainId();
  const contractAddress = CONTRACT_ADDRESSES[chainId]?.socialProfile;

  const { data: profile, isLoading, refetch } = useReadContract({
    address: contractAddress,
    abi: SOCIAL_PROFILE_ABI,
    functionName: "getProfile",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contractAddress },
  });

  return {
    profile,
    isLoading,
    refetch,
    contractAddress,
  };
}

export function useCreateProfile() {
  const chainId = useChainId();
  const contractAddress = CONTRACT_ADDRESSES[chainId]?.socialProfile;
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createProfile = (username: string, bio: string) => {
    if (!contractAddress) return;
    writeContract({
      address: contractAddress,
      abi: SOCIAL_PROFILE_ABI,
      functionName: "createProfile",
      args: [username, bio],
    });
  };

  return { createProfile, isPending, isConfirming, isSuccess, error };
}

export function useUpdateBio() {
  const chainId = useChainId();
  const contractAddress = CONTRACT_ADDRESSES[chainId]?.socialProfile;
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const updateBio = (bio: string) => {
    if (!contractAddress) return;
    writeContract({
      address: contractAddress,
      abi: SOCIAL_PROFILE_ABI,
      functionName: "updateBio",
      args: [bio],
    });
  };

  return { updateBio, isPending, isConfirming, isSuccess, error };
}
