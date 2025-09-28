import { useState, useEffect, useRef } from 'react';
import { validateProfile, validateFile } from '@/utils/profileValidation';
import { ProfileFormData, ProfileFormErrors, ActiveTab, PROFILE_API, convertToProfileFormData, addCacheBusting } from '@/types/profile';
import { useAppStore, User } from '@/store/useAppStore';
import { useParams } from 'react-router-dom';

interface UseEditProfileProps {
  isOpen: boolean;
  user: User;
  onSave: (updatedData: Partial<User>) => Promise<any>; // Allow return of server data
  onClose: () => void;
}

export function useEditProfile({ isOpen, user, onSave, onClose }: UseEditProfileProps) {
    const { address } = useParams();
  const { 
    user: globalUser, 
    updateUser, 
    notifyProfileUpdate,
    refetchProfile 
  } = useAppStore();
  
  const [resolvedUser, setResolvedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    displayName: '',
    username: '',
    bio: '',
    location: '',
    website: '',
    avatar: '',
    coverImage: '',
    email: '',
    phone: '',
    pronouns: ''
  });
  const [errors, setErrors] = useState<ProfileFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('basic');
  const [imageUploading, setImageUploading] = useState<'avatar' | 'cover' | null>(null);

  // ✅ FIX: Thêm ref để track image upload status
  const isUploadingRef = useRef(false);
  const lastUploadedImages = useRef<{ avatar?: string; coverImage?: string }>({});

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    const loadUser = async () => {
      try {
        // Prioritize global user state
        if (globalUser && globalUser._id) {
          setResolvedUser(globalUser);
          return;
        }

        // Fallback to prop user
        if (user && user._id) {
          setResolvedUser(user);
          return;
        }

        // Last resort: fetch by address
        if (address) {
          const res = await fetch(`${API_BASE}/api/users/by-address/${address}`);
          if (!res.ok) throw new Error('Không tìm thấy user');
          const data = await res.json();
          setResolvedUser(data);
        }
      } catch (err) {
        console.error('Failed to load user:', err);
      }
    };

    // Only load once when modal opens
    if (isOpen && !resolvedUser) {
      loadUser();
    }
  }, [isOpen, address, API_BASE]);

  useEffect(() => {
    if (!globalUser || !resolvedUser || globalUser._id !== resolvedUser._id) {
      return;
    }

    // ⚠️ QUAN TRỌNG: Chỉ sync khi KHÔNG đang upload
    if (isUploadingRef.current) {
      console.log('🚫 Skipping globalUser sync - currently uploading');
      return;
    }

    // Chỉ update nếu có thay đổi thực sự
    const hasAvatarChange = globalUser.avatar !== resolvedUser.avatar;
    const hasCoverChange = globalUser.coverImage !== resolvedUser.coverImage;

    if (hasAvatarChange || hasCoverChange) {
      console.log('🔄 Syncing with globalUser changes:', {
        avatar: hasAvatarChange ? globalUser.avatar : 'unchanged',
        coverImage: hasCoverChange ? globalUser.coverImage : 'unchanged'
      });

      setResolvedUser(prev => prev ? { ...prev, ...globalUser } : globalUser);
      
      // ✅ FIX: Chỉ update form data nếu không phải từ upload gần đây
      const isRecentUpload = 
        (hasAvatarChange && lastUploadedImages.current.avatar === globalUser.avatar) ||
        (hasCoverChange && lastUploadedImages.current.coverImage === globalUser.coverImage);

      if (!isRecentUpload) {
        setFormData(prev => ({
          ...prev,
          ...(hasAvatarChange && { avatar: globalUser.avatar }),
          ...(hasCoverChange && { coverImage: globalUser.coverImage }),
        }));
      }
    }
  }, [globalUser?.avatar, globalUser?.coverImage, resolvedUser]); // ✅ Specific dependencies

  // Initialize form data when user is resolved
  useEffect(() => {
    if (isOpen && resolvedUser && !isUploadingRef.current) {
      const profileData = convertToProfileFormData(resolvedUser);
      // Force refresh profile data if missing key fields
      if (!resolvedUser.pronouns && !resolvedUser.location && !resolvedUser.website) {
        refetchProfile?.();
      }
      setFormData(profileData);
      setErrors({});
      setActiveTab('basic');
    }
  }, [isOpen, resolvedUser, refetchProfile]);

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
// ✅ THÊM VÀO useEditProfile.ts - trong handleImageUpload

const handleImageUpload = async (
  file: File,
  type: 'avatar' | 'coverImage'
) => {
  if (!file || !resolvedUser?._id) return;
  
  // ✅ Handle empty file for removal
  if (file.size === 0) {
    // Handle image removal
    setFormData(prev => ({ ...prev, [type]: '' }));
    setResolvedUser(prev => prev ? { ...prev, [type]: '' } : null);
    updateUser({ [type]: '' });
    await onSave({ [type]: '' });
    return;
  }

  try {
    isUploadingRef.current = true;
    setImageUploading(type === 'avatar' ? 'avatar' : 'cover');

    console.log('📤 Starting image upload:', type);

    // ✅ Use unified validation
    const validationError = validateFile(file, type);
    if (validationError) {
      throw new Error(validationError);
    }

    const formData = new FormData();
    formData.append(type, file);

    // ✅ Use correct API endpoint với hashId
    const url = `${API_BASE}${PROFILE_API.uploadImage(resolvedUser._id)}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('user_hash_id')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(errorText || `Upload failed (${response.status})`);
    }

    const result = await response.json().catch(() => ({} as any));
    
    if (result?.success && result?.data) {
      // ✅ FIX: Lấy URL đã có cache-busting từ server
      let imageUrl = type === 'avatar' ? result.data.avatar : result.data.coverImage;
      
      // ✅ THÊM: Nếu server không trả cache-busting, thêm vào
      if (imageUrl && !imageUrl.includes('?t=')) {
        imageUrl = `${imageUrl}?t=${Date.now()}`;
      }
      
      console.log('✅ Upload successful, new URL with cache-busting:', imageUrl);
      
      // ✅ LƯU URL VỚI CACHE-BUSTING
      lastUploadedImages.current[type] = imageUrl;
      
      // 1. Update form data ngay lập tức
      setFormData(prev => ({ ...prev, [type]: imageUrl }));
      
      // 2. Update resolved user
      setResolvedUser(prev => prev ? { ...prev, [type]: imageUrl } : null);
      
      // 3. Update global user state
      updateUser({ [type]: imageUrl });
      
      // 4. Call parent onSave
      await onSave({ [type]: imageUrl });
      
      // ✅ THÊM: Force reload image trong DOM
      setTimeout(() => {
        const images = document.querySelectorAll(`img[src*="${type}"]`);
        images.forEach((img: any) => {
          if (img.src && img.src.includes('cloudinary.com')) {
            const newSrc = imageUrl;
            img.src = newSrc;
            console.log('🔄 Force reloaded image:', newSrc);
          }
        });
      }, 500);
      
      // 5. Notify (nhưng không refetch ngay)
      setTimeout(() => {
        notifyProfileUpdate();
      }, 1000);
      console.log('🎉 Image upload completed successfully');
    } else {
      throw new Error(result?.message || 'Upload failed');
    }
  } catch (error) {
    console.error('❌ Image upload failed:', error);
  } finally {
    setTimeout(() => {
      isUploadingRef.current = false;
    }, 2000); // Tăng delay lên 2s
    
    setImageUploading(null);
  }
};
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent multiple rapid submissions
    if (isLoading) {
      console.log('⏳ Already submitting, ignoring duplicate request');
      return null;
    }

    const validationErrors = validateProfile(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return null;
    }

    setIsLoading(true);
    try {
      // Call onSave to update via parent - may return server response
      let serverResponse;
      try {
        serverResponse = await onSave(formData);
      } catch (error) {
        // onSave throws error, re-throw it
        throw error;
      }
      
      // Update global user state with server response if available
      if (serverResponse && typeof serverResponse === 'object') {
        updateUser(serverResponse);
        // Update resolved user with server data to prevent overwrite
        setResolvedUser(serverResponse);
      } else {
        // Fallback to formData if no server response (void return)
        updateUser(formData);
        setResolvedUser(prev => prev ? { ...prev, ...formData } : null);
      }
      
      // Trigger profile update notification
      notifyProfileUpdate();
      return formData;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formData,
    errors,
    isLoading,
    activeTab,
    imageUploading,
    resolvedUser,
    setActiveTab,
    handleInputChange,
    handleImageUpload,
    handleSubmit,
  };
}