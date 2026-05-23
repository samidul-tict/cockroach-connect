// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ISocialPost {
    struct Post {
        uint256 id;
        address author;
        string content;
        uint256 timestamp;
        uint256 likeCount;
        uint256 parentPostId; // 0 = top-level post; non-zero = reply to that post ID
        bool exists;
    }

    event PostCreated(uint256 indexed postId, address indexed author, string content, uint256 parentPostId, uint256 timestamp);
    event PostLiked(uint256 indexed postId, address indexed liker, uint256 timestamp);
    event PostUnliked(uint256 indexed postId, address indexed unliker, uint256 timestamp);

    function createPost(string calldata content, uint256 parentPostId) external returns (uint256);
    function likePost(uint256 postId) external;
    function unlikePost(uint256 postId) external;
    function getPost(uint256 postId) external view returns (Post memory);
    function getUserPosts(address user) external view returns (uint256[] memory);
    function getReplies(uint256 postId) external view returns (uint256[] memory);
    function getTotalPosts() external view returns (uint256);
}
