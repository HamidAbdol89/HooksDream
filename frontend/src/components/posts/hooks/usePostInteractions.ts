// src/components/posts/hooks/usePostInteractions.ts
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Post } from '@/types/post';

export const usePostInteractions = (post: Post, onBookmark?: () => void) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked || false);
  const navigate = useNavigate();

  const handleUserClick = useCallback(() => {
    navigate(`/profile/${post.userId._id || post.userId.username}`);
  }, [post.userId, navigate]);

  const handleBookmark = useCallback(() => {
    setIsBookmarked(!isBookmarked);
    onBookmark?.();
  }, [isBookmarked, onBookmark]);

  return {
    isExpanded,
    setIsExpanded,
    showComments,
    setShowComments,
    isBookmarked,
    handleBookmark,
    handleUserClick
  };
};