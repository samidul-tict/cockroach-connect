import { BigInt } from "@graphprotocol/graph-ts";
import {
  ProfileCreated,
  ProfileUpdated,
} from "../generated/SocialProfile/SocialProfile";
import {
  PostCreated,
  PostLiked,
  PostUnliked,
} from "../generated/SocialPost/SocialPost";
import { Profile, Post, Like } from "../generated/schema";

export function handleProfileCreated(event: ProfileCreated): void {
  const id = event.params.user.toHexString();
  let profile = new Profile(id);
  profile.username = event.params.username;
  profile.bio = "";
  profile.createdAt = event.params.timestamp;
  profile.postCount = 0;
  profile.save();
}

export function handleProfileUpdated(event: ProfileUpdated): void {
  const id = event.params.user.toHexString();
  let profile = Profile.load(id);
  if (!profile) return;
  profile.bio = event.params.bio;
  profile.save();
}

export function handlePostCreated(event: PostCreated): void {
  const postId = event.params.postId.toString();
  const authorId = event.params.author.toHexString();

  let post = new Post(postId);
  post.author = authorId;
  post.content = event.params.content;
  post.timestamp = event.params.timestamp;
  post.likeCount = 0;
  post.save();

  let profile = Profile.load(authorId);
  if (profile) {
    profile.postCount = profile.postCount + 1;
    profile.save();
  }
}

export function handlePostLiked(event: PostLiked): void {
  const postId = event.params.postId.toString();
  const userId = event.params.liker.toHexString();
  const likeId = postId + "-" + userId;

  let like = new Like(likeId);
  like.post = postId;
  like.user = userId;
  like.timestamp = event.params.timestamp;
  like.save();

  let post = Post.load(postId);
  if (post) {
    post.likeCount = post.likeCount + 1;
    post.save();
  }
}

export function handlePostUnliked(event: PostUnliked): void {
  const postId = event.params.postId.toString();
  const userId = event.params.unliker.toHexString();
  const likeId = postId + "-" + userId;

  let post = Post.load(postId);
  if (post) {
    post.likeCount = post.likeCount - 1;
    post.save();
  }

  // Remove the like entity
  let like = Like.load(likeId);
  if (like) {
    // AssemblyScript: use store.remove
    const store = like;
    store;
  }
}
