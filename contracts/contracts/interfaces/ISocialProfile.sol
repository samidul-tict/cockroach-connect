// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ISocialProfile {
    struct Profile {
        string username;
        string bio;
        uint256 createdAt;
        bool exists;
    }

    event ProfileCreated(address indexed user, string username, uint256 timestamp);
    event ProfileUpdated(address indexed user, string bio, uint256 timestamp);

    function createProfile(string calldata username, string calldata bio) external;
    function updateBio(string calldata bio) external;
    function getProfile(address user) external view returns (Profile memory);
    function hasProfile(address user) external view returns (bool);
    function getUserByUsername(string calldata username) external view returns (address);
}
