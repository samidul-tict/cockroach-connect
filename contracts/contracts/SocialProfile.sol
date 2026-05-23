// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/ISocialProfile.sol";

contract SocialProfile is ISocialProfile {
    uint256 public constant MAX_USERNAME_LENGTH = 32;
    uint256 public constant MAX_BIO_LENGTH = 160;

    mapping(address => Profile) private _profiles;
    mapping(string => address) private _usernameToAddress;

    modifier requiresProfile() {
        require(_profiles[msg.sender].exists, "Profile does not exist");
        _;
    }

    function createProfile(string calldata username, string calldata bio) external override {
        require(!_profiles[msg.sender].exists, "Profile already exists");
        require(bytes(username).length > 0, "Username cannot be empty");
        require(bytes(username).length <= MAX_USERNAME_LENGTH, "Username too long (max 32 chars)");
        require(bytes(bio).length <= MAX_BIO_LENGTH, "Bio too long (max 160 chars)");
        require(_usernameToAddress[username] == address(0), "Username already taken");

        _profiles[msg.sender] = Profile({
            username: username,
            bio: bio,
            createdAt: block.timestamp,
            exists: true
        });
        _usernameToAddress[username] = msg.sender;

        emit ProfileCreated(msg.sender, username, block.timestamp);
    }

    function updateBio(string calldata bio) external override requiresProfile {
        require(bytes(bio).length <= MAX_BIO_LENGTH, "Bio too long (max 160 chars)");
        _profiles[msg.sender].bio = bio;
        emit ProfileUpdated(msg.sender, bio, block.timestamp);
    }

    function getProfile(address user) external view override returns (Profile memory) {
        return _profiles[user];
    }

    function hasProfile(address user) external view override returns (bool) {
        return _profiles[user].exists;
    }

    function getUserByUsername(string calldata username) external view override returns (address) {
        return _usernameToAddress[username];
    }
}
