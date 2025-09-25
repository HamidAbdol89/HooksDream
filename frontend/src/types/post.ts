// src/types/post.ts
export interface User {
  _id: string; // SỬA: bỏ dấu ? để thành required
  username: string;
  displayName: string;
  avatar?: string;
  isFollowing?: boolean;
  isVerified?: boolean;
}

export interface Post {
  _id: string;
  content: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  shareCount?: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  userId: User;
  images?: string[];
  video?: string;
  comments?: Comment[];
}

export interface Comment {
  _id: string;
  postId: string;
  userId: {
    _id: string;
    username: string;
    displayName: string;
    avatar: string;
  };
  content: string;
  parentCommentId?: string;
  replyCount: number;
  likeCount: number;
  image?: string;
  isLiked: boolean;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}