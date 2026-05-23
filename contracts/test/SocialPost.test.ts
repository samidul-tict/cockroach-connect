import { expect } from "chai";
import { ethers } from "hardhat";
import { SocialProfile, SocialPost } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("SocialPost", () => {
  let socialProfile: SocialProfile;
  let socialPost: SocialPost;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;
  let stranger: HardhatEthersSigner;

  beforeEach(async () => {
    [, alice, bob, stranger] = await ethers.getSigners();

    const SocialProfile = await ethers.getContractFactory("SocialProfile");
    socialProfile = await SocialProfile.deploy();

    const SocialPost = await ethers.getContractFactory("SocialPost");
    socialPost = await SocialPost.deploy(await socialProfile.getAddress());

    await socialProfile.connect(alice).createProfile("alice", "Alice here");
    await socialProfile.connect(bob).createProfile("bob", "Bob here");
  });

  describe("createPost (top-level)", () => {
    it("creates a post and returns its id", async () => {
      const tx = await socialPost.connect(alice).createPost("Hello blockchain!", 0);
      const receipt = await tx.wait();
      expect(receipt?.status).to.equal(1);

      const post = await socialPost.getPost(1);
      expect(post.content).to.equal("Hello blockchain!");
      expect(post.author).to.equal(alice.address);
      expect(post.likeCount).to.equal(0);
      expect(post.parentPostId).to.equal(0);
      expect(post.exists).to.be.true;
    });

    it("emits PostCreated event with parentPostId=0", async () => {
      await expect(socialPost.connect(alice).createPost("Hello!", 0))
        .to.emit(socialPost, "PostCreated")
        .withArgs(1, alice.address, "Hello!", 0, await getNextTimestamp());
    });

    it("tracks posts per user", async () => {
      await socialPost.connect(alice).createPost("Post 1", 0);
      await socialPost.connect(alice).createPost("Post 2", 0);
      await socialPost.connect(bob).createPost("Bob's post", 0);

      const alicePosts = await socialPost.getUserPosts(alice.address);
      const bobPosts = await socialPost.getUserPosts(bob.address);

      expect(alicePosts.length).to.equal(2);
      expect(bobPosts.length).to.equal(1);
    });

    it("reverts if content is empty", async () => {
      await expect(socialPost.connect(alice).createPost("", 0))
        .to.be.revertedWith("Content cannot be empty");
    });

    it("reverts if content exceeds 280 chars", async () => {
      const longContent = "a".repeat(281);
      await expect(socialPost.connect(alice).createPost(longContent, 0))
        .to.be.revertedWith("Content exceeds 280 characters");
    });

    it("accepts exactly 280 chars", async () => {
      const maxContent = "a".repeat(280);
      await expect(socialPost.connect(alice).createPost(maxContent, 0)).to.not.be.reverted;
    });

    it("reverts if caller has no profile", async () => {
      await expect(socialPost.connect(stranger).createPost("Hello", 0))
        .to.be.revertedWith("Must have a profile to interact");
    });
  });

  describe("createPost (replies)", () => {
    beforeEach(async () => {
      // Post ID 1: alice's top-level post
      await socialPost.connect(alice).createPost("Alice's original post", 0);
    });

    it("creates a reply referencing the parent post", async () => {
      await socialPost.connect(bob).createPost("Bob's reply", 1);

      const reply = await socialPost.getPost(2);
      expect(reply.content).to.equal("Bob's reply");
      expect(reply.parentPostId).to.equal(1);
      expect(reply.author).to.equal(bob.address);
    });

    it("emits PostCreated with the correct parentPostId", async () => {
      await expect(socialPost.connect(bob).createPost("Bob's reply", 1))
        .to.emit(socialPost, "PostCreated")
        .withArgs(2, bob.address, "Bob's reply", 1, await getNextTimestamp());
    });

    it("tracks the reply under the parent post", async () => {
      await socialPost.connect(bob).createPost("Reply 1", 1);
      await socialPost.connect(alice).createPost("Reply 2", 1);

      const replies = await socialPost.getReplies(1);
      expect(replies.length).to.equal(2);
      expect(replies[0]).to.equal(2n);
      expect(replies[1]).to.equal(3n);
    });

    it("allows nested replies (reply to a reply)", async () => {
      await socialPost.connect(bob).createPost("Bob's reply", 1);    // ID 2
      await socialPost.connect(alice).createPost("Alice's reply to Bob", 2); // ID 3

      const post3 = await socialPost.getPost(3);
      expect(post3.parentPostId).to.equal(2);

      const repliesOfReply = await socialPost.getReplies(2);
      expect(repliesOfReply.length).to.equal(1);
      expect(repliesOfReply[0]).to.equal(3n);
    });

    it("reply also appears in user's post list", async () => {
      await socialPost.connect(bob).createPost("Bob's reply", 1);
      const bobPosts = await socialPost.getUserPosts(bob.address);
      expect(bobPosts.length).to.equal(1);
      expect(bobPosts[0]).to.equal(2n);
    });

    it("reverts if parent post does not exist", async () => {
      await expect(socialPost.connect(bob).createPost("Reply to nowhere", 999))
        .to.be.revertedWith("Parent post does not exist");
    });

    it("reverts if reply content is empty", async () => {
      await expect(socialPost.connect(bob).createPost("", 1))
        .to.be.revertedWith("Content cannot be empty");
    });

    it("reverts if reply content exceeds 280 chars", async () => {
      const longContent = "a".repeat(281);
      await expect(socialPost.connect(bob).createPost(longContent, 1))
        .to.be.revertedWith("Content exceeds 280 characters");
    });
  });

  describe("getReplies", () => {
    it("returns empty array for post with no replies", async () => {
      await socialPost.connect(alice).createPost("Solo post", 0);
      const replies = await socialPost.getReplies(1);
      expect(replies.length).to.equal(0);
    });

    it("reverts for non-existent post", async () => {
      await expect(socialPost.getReplies(999))
        .to.be.revertedWith("Post does not exist");
    });
  });

  describe("likePost", () => {
    beforeEach(async () => {
      await socialPost.connect(alice).createPost("Alice's post", 0);
    });

    it("likes a post and increments like count", async () => {
      await socialPost.connect(bob).likePost(1);
      const post = await socialPost.getPost(1);
      expect(post.likeCount).to.equal(1);
    });

    it("emits PostLiked event", async () => {
      await expect(socialPost.connect(bob).likePost(1))
        .to.emit(socialPost, "PostLiked")
        .withArgs(1, bob.address, await getNextTimestamp());
    });

    it("tracks that user has liked the post", async () => {
      await socialPost.connect(bob).likePost(1);
      expect(await socialPost.hasLiked(1, bob.address)).to.be.true;
    });

    it("allows liking a reply", async () => {
      await socialPost.connect(bob).createPost("Bob's reply", 1);
      await socialPost.connect(alice).likePost(2);
      const reply = await socialPost.getPost(2);
      expect(reply.likeCount).to.equal(1);
    });

    it("reverts if already liked", async () => {
      await socialPost.connect(bob).likePost(1);
      await expect(socialPost.connect(bob).likePost(1))
        .to.be.revertedWith("Already liked this post");
    });

    it("reverts if author tries to like own post", async () => {
      await expect(socialPost.connect(alice).likePost(1))
        .to.be.revertedWith("Cannot like your own post");
    });

    it("reverts if post does not exist", async () => {
      await expect(socialPost.connect(bob).likePost(999))
        .to.be.revertedWith("Post does not exist");
    });
  });

  describe("unlikePost", () => {
    beforeEach(async () => {
      await socialPost.connect(alice).createPost("Alice's post", 0);
      await socialPost.connect(bob).likePost(1);
    });

    it("unlikes a post and decrements like count", async () => {
      await socialPost.connect(bob).unlikePost(1);
      const post = await socialPost.getPost(1);
      expect(post.likeCount).to.equal(0);
    });

    it("emits PostUnliked event", async () => {
      await expect(socialPost.connect(bob).unlikePost(1))
        .to.emit(socialPost, "PostUnliked")
        .withArgs(1, bob.address, await getNextTimestamp());
    });

    it("reverts if not previously liked", async () => {
      await expect(socialPost.connect(alice).unlikePost(1))
        .to.be.revertedWith("Have not liked this post");
    });
  });

  describe("getTotalPosts", () => {
    it("counts both top-level posts and replies", async () => {
      expect(await socialPost.getTotalPosts()).to.equal(0);
      await socialPost.connect(alice).createPost("Post 1", 0);
      await socialPost.connect(bob).createPost("Reply to post 1", 1);
      expect(await socialPost.getTotalPosts()).to.equal(2);
    });
  });
});

async function getNextTimestamp(): Promise<number> {
  const block = await ethers.provider.getBlock("latest");
  return block!.timestamp + 1;
}
