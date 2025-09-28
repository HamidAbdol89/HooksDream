// ✅ UNIFIED VALIDATION - Sync với backend và single source of truth
import { ProfileFormData, ProfileFormErrors, VALIDATION_RULES, FILE_UPLOAD } from '@/types/profile';

export const validateProfile = (formData: ProfileFormData): ProfileFormErrors => {
  const errors: ProfileFormErrors = {};

  // ✅ Display Name validation
  if (!formData.displayName?.trim()) {
    errors.displayName = 'Display name is required';
  } else if (formData.displayName.length > VALIDATION_RULES.displayName.maxLength) {
    errors.displayName = `Display name must be less than ${VALIDATION_RULES.displayName.maxLength} characters`;
  }

  // ✅ Username validation
  if (!formData.username?.trim()) {
    errors.username = 'Username is required';
  } else if (!VALIDATION_RULES.username.pattern.test(formData.username)) {
    errors.username = 'Username can only contain letters, numbers, and underscores';
  } else if (formData.username.length < VALIDATION_RULES.username.minLength) {
    errors.username = `Username must be at least ${VALIDATION_RULES.username.minLength} characters`;
  } else if (formData.username.length > VALIDATION_RULES.username.maxLength) {
    errors.username = `Username must be less than ${VALIDATION_RULES.username.maxLength} characters`;
  }

  // ✅ Bio validation
  if (formData.bio && formData.bio.length > VALIDATION_RULES.bio.maxLength) {
    errors.bio = `Bio must be less than ${VALIDATION_RULES.bio.maxLength} characters`;
  }

  // ✅ Website validation - sync với backend (cho phép không có protocol)
  if (formData.website && formData.website.trim()) {
    // Thêm http:// nếu không có protocol
    let websiteToTest = formData.website;
    if (!websiteToTest.match(/^https?:\/\//)) {
      websiteToTest = `http://${websiteToTest}`;
    }
    
    if (!VALIDATION_RULES.website.pattern.test(websiteToTest)) {
      errors.website = 'Please enter a valid website URL';
    }
  }

  // ✅ Email validation
  if (formData.email && formData.email.trim() && !VALIDATION_RULES.email.pattern.test(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // ✅ Phone validation - sync với backend
  if (formData.phone && formData.phone.trim() && !VALIDATION_RULES.phone.pattern.test(formData.phone)) {
    errors.phone = 'Please enter a valid phone number (international format)';
  }

  // ✅ Pronouns validation
  if (formData.pronouns && formData.pronouns.length > VALIDATION_RULES.pronouns.maxLength) {
    errors.pronouns = `Pronouns must be less than ${VALIDATION_RULES.pronouns.maxLength} characters`;
  }

  return errors;
};

// ✅ File validation
export const validateFile = (file: File, type: 'avatar' | 'coverImage'): string | null => {
  const config = FILE_UPLOAD[type];
  
  if (file.size > config.maxSize) {
    return `File size too large. Maximum ${config.maxSize / (1024 * 1024)}MB allowed.`;
  }
  
  if (!config.acceptedTypes.includes(file.type as any)) {
    return `Invalid file type. Accepted: ${config.acceptedTypes.join(', ')}`;
  }
  
  return null;
};

// ✅ Export constants from single source
export const MAX_AVATAR_SIZE = FILE_UPLOAD.avatar.maxSize;
export const MAX_COVER_SIZE = FILE_UPLOAD.coverImage.maxSize;