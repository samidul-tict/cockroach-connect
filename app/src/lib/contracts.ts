import type { Address } from "viem";

export const CONTRACT_ADDRESSES: Record<number, { socialProfile: Address; socialPost: Address }> = {
  // Hardhat local
  31337: {
    socialProfile: (process.env.NEXT_PUBLIC_SOCIAL_PROFILE_ADDRESS || "0x0") as Address,
    socialPost: (process.env.NEXT_PUBLIC_SOCIAL_POST_ADDRESS || "0x0") as Address,
  },
  // Base Sepolia testnet
  84532: {
    socialProfile: (process.env.NEXT_PUBLIC_SOCIAL_PROFILE_ADDRESS || "0x0") as Address,
    socialPost: (process.env.NEXT_PUBLIC_SOCIAL_POST_ADDRESS || "0x0") as Address,
  },
  // Base mainnet
  8453: {
    socialProfile: (process.env.NEXT_PUBLIC_SOCIAL_PROFILE_ADDRESS || "0x0") as Address,
    socialPost: (process.env.NEXT_PUBLIC_SOCIAL_POST_ADDRESS || "0x0") as Address,
  },
};

export const SOCIAL_PROFILE_ABI = [
  {
    name: "createProfile",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "username", type: "string" }, { name: "bio", type: "string" }],
    outputs: [],
  },
  {
    name: "updateBio",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "bio", type: "string" }],
    outputs: [],
  },
  {
    name: "getProfile",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "username", type: "string" },
          { name: "bio", type: "string" },
          { name: "createdAt", type: "uint256" },
          { name: "exists", type: "bool" },
        ],
      },
    ],
  },
  {
    name: "hasProfile",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "getUserByUsername",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "username", type: "string" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "ProfileCreated",
    type: "event",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "username", type: "string", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
] as const;

export const SOCIAL_POST_ABI = [
  {
    name: "createPost",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "content", type: "string" },
      { name: "parentPostId", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "likePost",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "postId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "unlikePost",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "postId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "getPost",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "postId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "id", type: "uint256" },
          { name: "author", type: "address" },
          { name: "content", type: "string" },
          { name: "timestamp", type: "uint256" },
          { name: "likeCount", type: "uint256" },
          { name: "parentPostId", type: "uint256" },
          { name: "exists", type: "bool" },
        ],
      },
    ],
  },
  {
    name: "getUserPosts",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }],
  },
  {
    name: "getReplies",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "postId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256[]" }],
  },
  {
    name: "getTotalPosts",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "hasLiked",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "postId", type: "uint256" }, { name: "user", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "PostCreated",
    type: "event",
    inputs: [
      { name: "postId", type: "uint256", indexed: true },
      { name: "author", type: "address", indexed: true },
      { name: "content", type: "string", indexed: false },
      { name: "parentPostId", type: "uint256", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
  {
    name: "PostLiked",
    type: "event",
    inputs: [
      { name: "postId", type: "uint256", indexed: true },
      { name: "liker", type: "address", indexed: true },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
] as const;
