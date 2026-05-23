import { expect } from "chai";
import { ethers } from "hardhat";
import { SocialProfile } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("SocialProfile", () => {
  let socialProfile: SocialProfile;
  let owner: HardhatEthersSigner;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;

  beforeEach(async () => {
    [owner, alice, bob] = await ethers.getSigners();
    const SocialProfile = await ethers.getContractFactory("SocialProfile");
    socialProfile = await SocialProfile.deploy();
  });

  describe("createProfile", () => {
    it("creates a profile with username and bio", async () => {
      await socialProfile.connect(alice).createProfile("alice", "Hello world");
      const profile = await socialProfile.getProfile(alice.address);

      expect(profile.username).to.equal("alice");
      expect(profile.bio).to.equal("Hello world");
      expect(profile.exists).to.be.true;
    });

    it("emits ProfileCreated event", async () => {
      await expect(socialProfile.connect(alice).createProfile("alice", "bio"))
        .to.emit(socialProfile, "ProfileCreated")
        .withArgs(alice.address, "alice", await getTimestamp());
    });

    it("reverts if profile already exists", async () => {
      await socialProfile.connect(alice).createProfile("alice", "bio");
      await expect(
        socialProfile.connect(alice).createProfile("alice2", "bio")
      ).to.be.revertedWith("Profile already exists");
    });

    it("reverts if username is taken", async () => {
      await socialProfile.connect(alice).createProfile("alice", "bio");
      await expect(
        socialProfile.connect(bob).createProfile("alice", "bio")
      ).to.be.revertedWith("Username already taken");
    });

    it("reverts if username is empty", async () => {
      await expect(
        socialProfile.connect(alice).createProfile("", "bio")
      ).to.be.revertedWith("Username cannot be empty");
    });

    it("reverts if username exceeds 32 chars", async () => {
      const longUsername = "a".repeat(33);
      await expect(
        socialProfile.connect(alice).createProfile(longUsername, "bio")
      ).to.be.revertedWith("Username too long (max 32 chars)");
    });

    it("reverts if bio exceeds 160 chars", async () => {
      const longBio = "a".repeat(161);
      await expect(
        socialProfile.connect(alice).createProfile("alice", longBio)
      ).to.be.revertedWith("Bio too long (max 160 chars)");
    });
  });

  describe("updateBio", () => {
    beforeEach(async () => {
      await socialProfile.connect(alice).createProfile("alice", "original bio");
    });

    it("updates bio", async () => {
      await socialProfile.connect(alice).updateBio("updated bio");
      const profile = await socialProfile.getProfile(alice.address);
      expect(profile.bio).to.equal("updated bio");
    });

    it("emits ProfileUpdated event", async () => {
      await expect(socialProfile.connect(alice).updateBio("updated bio"))
        .to.emit(socialProfile, "ProfileUpdated")
        .withArgs(alice.address, "updated bio", await getTimestamp());
    });

    it("reverts if profile does not exist", async () => {
      await expect(
        socialProfile.connect(bob).updateBio("bio")
      ).to.be.revertedWith("Profile does not exist");
    });
  });

  describe("getUserByUsername", () => {
    it("returns address for a registered username", async () => {
      await socialProfile.connect(alice).createProfile("alice", "bio");
      const addr = await socialProfile.getUserByUsername("alice");
      expect(addr).to.equal(alice.address);
    });

    it("returns zero address for unknown username", async () => {
      const addr = await socialProfile.getUserByUsername("unknown");
      expect(addr).to.equal(ethers.ZeroAddress);
    });
  });

  describe("hasProfile", () => {
    it("returns true for existing profile", async () => {
      await socialProfile.connect(alice).createProfile("alice", "bio");
      expect(await socialProfile.hasProfile(alice.address)).to.be.true;
    });

    it("returns false for non-existing profile", async () => {
      expect(await socialProfile.hasProfile(bob.address)).to.be.false;
    });
  });
});

async function getTimestamp(): Promise<number> {
  const block = await ethers.provider.getBlock("latest");
  return block!.timestamp + 1;
}
