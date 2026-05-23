// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/ISocialPost.sol";
import "./interfaces/ISocialProfile.sol";

contract SocialPost is ISocialPost {
    uint256 public constant MAX_POST_LENGTH = 280;

    ISocialProfile public immutable profileContract;

    uint256 private _postIdCounter;
    mapping(uint256 => Post) private _posts;
    mapping(address => uint256[]) private _userPosts;
    mapping(uint256 => uint256[]) private _replies;    // parentPostId => reply post IDs
    mapping(uint256 => mapping(address => bool)) private _hasLiked;

    constructor(address profileContractAddress) {
        require(profileContractAddress != address(0), "Invalid profile contract address");
        profileContract = ISocialProfile(profileContractAddress);
    }

    modifier requiresProfile() {
        require(profileContract.hasProfile(msg.sender), "Must have a profile to interact");
        _;
    }

    function createPost(string calldata content, uint256 parentPostId) external override requiresProfile returns (uint256) {
        require(bytes(content).length > 0, "Content cannot be empty");
        require(bytes(content).length <= MAX_POST_LENGTH, "Content exceeds 280 characters");
        if (parentPostId != 0) {
            require(_posts[parentPostId].exists, "Parent post does not exist");
        }

        uint256 postId = ++_postIdCounter;
        _posts[postId] = Post({
            id: postId,
            author: msg.sender,
            content: content,
            timestamp: block.timestamp,
            likeCount: 0,
            parentPostId: parentPostId,
            exists: true
        });
        _userPosts[msg.sender].push(postId);

        if (parentPostId != 0) {
            _replies[parentPostId].push(postId);
        }

        emit PostCreated(postId, msg.sender, content, parentPostId, block.timestamp);
        return postId;
    }

    function likePost(uint256 postId) external override requiresProfile {
        require(_posts[postId].exists, "Post does not exist");
        require(!_hasLiked[postId][msg.sender], "Already liked this post");
        require(_posts[postId].author != msg.sender, "Cannot like your own post");

        _hasLiked[postId][msg.sender] = true;
        _posts[postId].likeCount++;

        emit PostLiked(postId, msg.sender, block.timestamp);
    }

    function unlikePost(uint256 postId) external override {
        require(_posts[postId].exists, "Post does not exist");
        require(_hasLiked[postId][msg.sender], "Have not liked this post");

        _hasLiked[postId][msg.sender] = false;
        _posts[postId].likeCount--;

        emit PostUnliked(postId, msg.sender, block.timestamp);
    }

    function getPost(uint256 postId) external view override returns (Post memory) {
        require(_posts[postId].exists, "Post does not exist");
        return _posts[postId];
    }

    function getUserPosts(address user) external view override returns (uint256[] memory) {
        return _userPosts[user];
    }

    function getReplies(uint256 postId) external view override returns (uint256[] memory) {
        require(_posts[postId].exists, "Post does not exist");
        return _replies[postId];
    }

    function getTotalPosts() external view override returns (uint256) {
        return _postIdCounter;
    }

    function hasLiked(uint256 postId, address user) external view returns (bool) {
        return _hasLiked[postId][user];
    }
}
