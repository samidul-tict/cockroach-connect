# CockroachConnect — Architecture

A decentralized, text-only social network built on blockchain. Identity is a wallet address. Posts are immutable on-chain. No images, no videos — only text with a 280-character limit.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Smart Contracts](#smart-contracts)
5. [Frontend](#frontend)
6. [The Graph Subgraph](#the-graph-subgraph)
7. [Local Development](#local-development)
8. [Testnet Deployment (Base Sepolia)](#testnet-deployment-base-sepolia)
9. [Mainnet Deployment (Base)](#mainnet-deployment-base)
10. [Future: DAO](#future-dao)
11. [Future: Native Token](#future-native-token)
12. [Design Decisions](#design-decisions)

---

## Overview

```
User (MetaMask) ──► Next.js dApp ──► Smart Contracts (Base)
                         │
                    The Graph ◄─── Contract Events
```

- **Authentication**: wallet signature via MetaMask / WalletConnect. No passwords.
- **Identity**: one profile per wallet address. Username is unique and immutable once set.
- **Posts**: stored directly on-chain as calldata. Max 280 UTF-8 bytes enforced at the contract level — not just the UI.
- **Reads**: The Graph indexes contract events into GraphQL, making feed queries fast without scanning blocks.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Chain | **Base** (Coinbase L2) | EVM-compatible, ~$0.001 per tx, fast finality |
| Smart Contracts | **Solidity 0.8.20** | Mature, EVM standard |
| Contract Tooling | **Hardhat + TypeScript** | Best TypeScript DX, `typechain-types` generation |
| Frontend | **Next.js 14** (App Router) | React + SSR, TypeScript-first |
| Web3 | **wagmi v2 + viem** | Type-safe hooks, replaces ethers.js |
| Wallet UI | **RainbowKit** | MetaMask, Coinbase Wallet, WalletConnect out of the box |
| Indexing | **The Graph** | Fast GraphQL queries over contract events |
| DAO (future) | **OpenZeppelin Governor** | Audited, battle-tested |
| Token (future) | **ERC-20** | Standard fungible token |

---

## Project Structure

```
cockroach-connect/
├── package.json              ← npm workspaces root
├── .gitignore
├── ARCHITECTURE.md           ← this file
│
├── contracts/                ← Hardhat project
│   ├── hardhat.config.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── contracts/
│   │   ├── interfaces/
│   │   │   ├── ISocialProfile.sol
│   │   │   └── ISocialPost.sol
│   │   ├── SocialProfile.sol
│   │   └── SocialPost.sol
│   ├── scripts/
│   │   └── deploy.ts         ← deploys both contracts, writes ABIs to app/
│   └── test/
│       ├── SocialProfile.test.ts
│       └── SocialPost.test.ts
│
├── app/                      ← Next.js frontend
│   ├── next.config.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── src/
│       ├── app/
│       │   ├── layout.tsx    ← wraps everything in Providers
│       │   ├── page.tsx      ← main feed page
│       │   ├── providers.tsx ← wagmi + RainbowKit + ReactQuery
│       │   └── globals.css
│       ├── components/
│       │   ├── ConnectButton.tsx
│       │   ├── ProfileSetup.tsx
│       │   ├── PostForm.tsx
│       │   ├── PostCard.tsx
│       │   └── PostFeed.tsx
│       ├── hooks/
│       │   ├── useProfile.ts ← read/write profile contract
│       │   └── usePosts.ts   ← read/write post contract
│       └── lib/
│           ├── wagmi.ts      ← chain config, connectors
│           └── contracts.ts  ← addresses + ABIs
│
└── subgraph/                 ← The Graph indexer
    ├── subgraph.yaml         ← data source config
    ├── schema.graphql        ← Profile, Post, Like entities
    ├── package.json
    └── src/
        └── mappings.ts       ← event handlers
```

---

## Smart Contracts

### SocialProfile.sol

Manages on-chain identity. One profile per wallet address.

| Function | Description |
|---|---|
| `createProfile(username, bio)` | Register a profile. Username must be unique (1–32 chars). Bio max 160 chars. |
| `updateBio(bio)` | Update bio. Requires existing profile. |
| `getProfile(address)` | Returns `Profile` struct for any address. |
| `hasProfile(address)` | Returns bool. Used by `SocialPost` as a gate. |
| `getUserByUsername(username)` | Reverse lookup — username → address. |

**Key constraints (enforced on-chain):**
- One profile per address
- Usernames are globally unique and permanent
- Username: 1–32 chars, Bio: 0–160 chars

**Events:** `ProfileCreated`, `ProfileUpdated`

---

### SocialPost.sol

Manages posts, replies, and likes. References `SocialProfile` — you must have a profile to post or like.

| Function | Description |
|---|---|
| `createPost(content, parentPostId)` | Publish a post or reply. `parentPostId=0` = top-level. Max 280 bytes. Returns `postId`. |
| `likePost(postId)` | Like a post or reply. Cannot like own post or like twice. |
| `unlikePost(postId)` | Remove a like. |
| `getPost(postId)` | Returns full `Post` struct including `parentPostId`. |
| `getUserPosts(address)` | Returns array of post IDs for a user (includes replies). |
| `getReplies(postId)` | Returns array of reply post IDs for a given post. |
| `getTotalPosts()` | Total posts ever created (also the latest ID). |
| `hasLiked(postId, address)` | Check if a user has liked a post. |

**Post struct:**
```
id            uint256  — unique post ID
author        address  — wallet that posted
content       string   — 1–280 bytes
timestamp     uint256  — block.timestamp
likeCount     uint256  — running total
parentPostId  uint256  — 0 = top-level, non-zero = reply to that post
exists        bool
```

**Reply threading:**
- A reply is just a post with `parentPostId != 0`.
- The parent post must exist on-chain — you cannot reply to a deleted/non-existent post.
- Replies can themselves be replied to (unlimited nesting on-chain; UI limits display to 2 levels deep).
- `getReplies(postId)` returns direct children only. To walk deeper, call `getReplies` on each child.

**Key constraints (enforced on-chain):**
- Caller must have a profile
- Post content: 1–280 bytes
- If `parentPostId != 0`, parent post must exist
- No self-likes, no duplicate likes

**Events:** `PostCreated(postId, author, content, parentPostId, timestamp)`, `PostLiked`, `PostUnliked`

---

### Contract Addresses

After deployment, addresses are saved to `contracts/deployments/<network>.json` and must be set in `app/.env.local`.

---

## Frontend

### Authentication Flow

```
User visits app
  └─► Not connected → ConnectButton (RainbowKit)
        └─► Connected, no profile → ProfileSetup component
              └─► Has profile → PostForm + PostFeed
```

### Key Hooks

**`useProfile(address)`** — reads profile from chain. Used to gate UI and display usernames.

**`useCreateProfile()`** — writes to `SocialProfile.createProfile`. Tracks pending → confirming → success states.

**`useCreatePost()`** — writes to `SocialPost.createPost(content, parentPostId)`. Defaults `parentPostId` to `0n`. Resets form on success.

**`useReplies(postId)`** — reads `getReplies(postId)` from chain. Returns direct child post IDs.

**`useLikePost()`** — handles both like and unlike in one hook.

**`useRecentPosts(limit)`** — fetches the N most recent post IDs by reading `getTotalPosts()` and iterating backwards. **Replace this with a The Graph query in production** (see below).

### Reply threading in the UI

`PostCard` is recursive. It accepts a `depth` prop (default `0`) and:
- Shows a **↩ Reply** button when the user is connected and `depth < 2`.
- Clicking it renders an inline `PostForm` with `parentPostId` pre-filled.
- After a successful reply, it collapses the form and shows replies via `useReplies`.
- `PostCard` renders its children as `<PostCard depth={depth+1} />`, indented with a left border.
- UI nesting is capped at depth 2 to avoid infinite scroll. On-chain nesting is unlimited.

`PostForm` accepts `parentPostId?: bigint` and `onSuccess?: () => void`. When `parentPostId` is set, the button label changes to "Reply" and the placeholder changes accordingly.

### Adding The Graph Queries

Once the subgraph is deployed, replace `useRecentPosts` with a GraphQL query:

```typescript
// Example query for the feed
const FEED_QUERY = gql`
  query GetFeed($skip: Int!, $first: Int!) {
    posts(orderBy: timestamp, orderDirection: desc, skip: $skip, first: $first) {
      id
      content
      timestamp
      likeCount
      author {
        username
      }
    }
  }
`;
```

Use `@apollo/client` or `urql` with the subgraph endpoint from `NEXT_PUBLIC_GRAPH_API_URL`.

---

## The Graph Subgraph

The subgraph listens to contract events and builds a queryable GraphQL index.

### Entities

| Entity | Description |
|---|---|
| `Profile` | One per wallet. Stores username, bio, postCount. |
| `Post` | One per on-chain post. Stores content, likeCount. |
| `Like` | Junction entity. ID = `postId-userAddress`. Deleted on unlike. |

### Event Handlers (`src/mappings.ts`)

| Contract Event | Handler | Action |
|---|---|---|
| `ProfileCreated` | `handleProfileCreated` | Creates `Profile` entity |
| `ProfileUpdated` | `handleProfileUpdated` | Updates bio on `Profile` |
| `PostCreated` | `handlePostCreated` | Creates `Post`, increments profile `postCount` |
| `PostLiked` | `handlePostLiked` | Creates `Like`, increments post `likeCount` |
| `PostUnliked` | `handlePostUnliked` | Removes `Like`, decrements post `likeCount` |

---

## Local Development

### Prerequisites

- Node.js 20+
- npm 10+
- MetaMask browser extension

### 1. Install dependencies

```bash
npm install
```

### 2. Start local blockchain

```bash
cd contracts
npm run node
# Hardhat spins up http://127.0.0.1:8545 with 20 funded test accounts
```

### 3. Deploy contracts locally

In a second terminal:

```bash
cd contracts
cp .env.example .env
npm run deploy:local
# Prints deployed addresses — copy them to app/.env.local
```

### 4. Configure the frontend

```bash
cd app
cp .env.example .env.local
# Edit .env.local:
#   NEXT_PUBLIC_CHAIN_ID=31337
#   NEXT_PUBLIC_SOCIAL_PROFILE_ADDRESS=<from deploy output>
#   NEXT_PUBLIC_SOCIAL_POST_ADDRESS=<from deploy output>
#   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<any string for local dev>
```

### 5. Start the frontend

```bash
cd app
npm run dev
# Opens http://localhost:3000
```

### 6. Connect MetaMask to local network

- Network: `Localhost 8545`
- Chain ID: `31337`
- Import a Hardhat test account using its private key (printed by `npm run node`)

### 7. Run contract tests

```bash
cd contracts
npm test
```

---

## Testnet Deployment (Base Sepolia)

1. Get testnet ETH from [Base Sepolia faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
2. Set `contracts/.env`:
   ```
   PRIVATE_KEY=your_wallet_private_key
   BASESCAN_API_KEY=from_basescan.org
   ```
3. Deploy:
   ```bash
   cd contracts
   npm run deploy:testnet
   ```
4. Update `app/.env.local` with the new addresses and `NEXT_PUBLIC_CHAIN_ID=84532`
5. Deploy subgraph to Subgraph Studio:
   - Update `subgraph/subgraph.yaml` with deployed contract addresses and `startBlock`
   - `cd subgraph && npm run deploy:studio`

---

## Mainnet Deployment (Base)

Same steps as testnet but:
- Use `npm run deploy:mainnet` in contracts
- Use `NEXT_PUBLIC_CHAIN_ID=8453`
- Set network in `subgraph.yaml` to `base`
- Deploy frontend to Vercel or similar

---

## Future: DAO

The DAO will allow token holders to vote on:
- Platform rules (e.g., max post length, spam policy)
- Treasury spending
- Contract upgrades (via OpenZeppelin's `TransparentUpgradeableProxy`)

### Planned Contracts

```
SocialDAO.sol          ← OpenZeppelin Governor
SocialDAOToken.sol     ← ERC-20Votes (voting power = token balance)
Timelock.sol           ← OpenZeppelin TimelockController (execution delay)
```

### Governance Flow

```
Proposal created (by token holder)
  └─► Voting period (e.g., 3 days)
        └─► Quorum reached + majority yes
              └─► Timelock delay (e.g., 2 days)
                    └─► Execution
```

### Integration with existing contracts

`SocialProfile` and `SocialPost` will be owned by the `Timelock`, so parameter changes (like `MAX_POST_LENGTH`) require a DAO vote to execute.

---

## Future: Native Token

The platform token (`$CRCK` or similar ERC-20) will serve as:

| Use | Description |
|---|---|
| **Governance** | Vote on DAO proposals (ERC-20Votes) |
| **Rewards** | Earned by posting, receiving likes, early participation |
| **Tipping** | Send tokens to post authors you appreciate |
| **Anti-spam** | Small token stake required to post (disincentivizes spam) |

### Distribution Ideas (to be voted on via DAO)

- 40% — user rewards (posting, engagement)
- 20% — early adopters / genesis users
- 20% — treasury (governed by DAO)
- 10% — development fund
- 10% — liquidity

---

## Design Decisions

**Why Base?** Low gas fees (~$0.001/tx) make it practical for social interactions. EVM-compatible so all standard tooling works.

**Why store posts on-chain and not IPFS?** Text-only posts with a 280-byte limit are small enough that on-chain storage is viable. This ensures posts are permanent, censorship-resistant, and don't depend on IPFS availability.

**Why wagmi v2 + viem over ethers.js?** Fully TypeScript-native, React hooks reduce boilerplate, and viem provides better type inference for ABIs (using `as const`).

**Why The Graph?** Reading the full post history by iterating IDs on-chain doesn't scale. The Graph turns contract events into a fast GraphQL API without running a centralized backend.

**Why no backend?** Everything is either on-chain or indexed by The Graph. The frontend is a static Next.js app that can be deployed to IPFS itself for full decentralization.
