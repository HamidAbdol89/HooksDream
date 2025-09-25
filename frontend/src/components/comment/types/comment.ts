// src/types/comment.ts - THÊM FILE MỚI
export interface CommentUser {
  _id: string;
  username: string;
  displayName: string;
  avatar: string;
}

export interface Comment {
  _id: string;
  postId: string;
  userId: CommentUser;
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