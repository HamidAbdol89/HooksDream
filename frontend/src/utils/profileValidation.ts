import { ProfileFormData, FormErrors } from '@/types/user';

export const validateProfile = (formData: ProfileFormData): FormErrors => {
  const errors: FormErrors = {};

  if (!formData.displayName?.trim()) {
    errors.displayName = 'Display name is required';
  } else if (formData.displayName.length > 50) {
    errors.displayName = 'Display name must be less than 50 characters';
  }

  if (!formData.username?.trim()) {
    errors.username = 'Username is required';
  } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
    errors.username = 'Username can only contain letters, numbers, and underscores';
  } else if (formData.username.length < 3) {
    errors.username = 'Username must be at least 3 characters';
  } else if (formData.username.length > 20) {
    errors.username = 'Username must be less than 20 characters';
  }

  if (formData.bio && formData.bio.length > 160) {
    errors.bio = 'Bio must be less than 160 characters';
  }

  if (formData.website && !formData.website.match(/^https?:\/\/.+/)) {
    errors.website = 'Website must be a valid URL (include http:// or https://)';
  }

  if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (formData.phone && !/^[\d\s+\-()]{10,20}$/.test(formData.phone)) {
    errors.phone = 'Please enter a valid phone number';
  }

  return errors;
};

export const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
export const MAX_COVER_SIZE = 5 * 1024 * 1024; // 5MB