import { useState, useEffect, useRef } from 'react';
import { validateProfile, MAX_AVATAR_SIZE, MAX_COVER_SIZE } from '@/utils/profileValidation';
import { useAppStore, User } from '@/store/useAppStore';
import { useParams } from 'react-router-dom';

// Local types for form management
type ProfileFormData = {
  displayName?: string;
  username?: string;
  bio?: string;
  location?: string;
  website?: string;
  avatar?: string;
  coverImage?: string;
  email?: string;
  phone?: string;
  pronouns?: string;
};

type FormErrors = {
  [K in keyof ProfileFormData]?: string;
};

type ActiveTab = 'basic' | 'images' | 'social' | 'account';

interface UseEditProfileProps {
  isOpen: boolean;
  user: User;
  onSave: (updatedData: Partial<User>) => Promise<void>;
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
  const [formData, setFormData] = useState<ProfileFormData>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('basic');
  const [imageUploading, setImageUploading] = useState<'avatar' | 'cover' | null>(null);

  // ✅ FIX: Thêm ref để track image upload status
  const isUploadingRef = useRef(false);
  const lastUploadedImages = useRef<{ avatar?: string; coverImage?: string }>({});

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  // Load user data when modal opens - only once
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Prioritize global user state
        if (globalUser && globalUser._id) {
          setResolvedUser(globalUser);
          // ✅ FIX: Lưu image URLs hiện tại
          lastUploadedImages.current = {
            avatar: globalUser.avatar,
            coverImage: globalUser.coverImage
          };
          return;
        }

        // Fallback to prop user
        if (user && user._id) {
          setResolvedUser(user);
          lastUploadedImages.current = {
            avatar: user.avatar,
            coverImage: user.coverImage
          };
          return;
        }

        // Last resort: fetch by address
        if (address) {
          const res = await fetch(`${API_BASE}/api/users/by-address/${address}`);
          if (!res.ok) throw new Error('Không tìm thấy user');
          const data = await res.json();
          setResolvedUser(data);
          lastUploadedImages.current = {
            avatar: data.avatar,
            coverImage: data.coverImage
          };
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

  // ✅ FIX: Cải thiện logic sync với globalUser
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
      setFormData({
        displayName: resolvedUser.displayName,
        username: resolvedUser.username,
        bio: resolvedUser.bio,
        location: resolvedUser.location,
        website: resolvedUser.website,
        avatar: resolvedUser.avatar,
        coverImage: resolvedUser.coverImage,
        email: resolvedUser.email,
        phone: resolvedUser.phone,
        pronouns: resolvedUser.pronouns,
      });
      setErrors({});
      setActiveTab('basic');
    }
  }, [isOpen, resolvedUser]);

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
// ✅ THÊM VÀO useEditProfile.ts - trong handleImageUpload

const handleImageUpload = async (
  e: React.ChangeEvent<HTMLInputElement>,
  type: 'avatar' | 'coverImage'
) => {
  const file = e.target.files?.[0];
  if (!file || !resolvedUser?._id) return;

  try {
    isUploadingRef.current = true;
    setImageUploading(type === 'avatar' ? 'avatar' : 'cover');

    console.log('📤 Starting image upload:', type);

    const maxSize = type === 'avatar' ? MAX_AVATAR_SIZE : MAX_COVER_SIZE;
    if (file.size > maxSize) {
      throw new Error(`File too large. Max size: ${maxSize / (1024 * 1024)}MB`);
    }

    const formData = new FormData();
    formData.append(type, file);

    const url = `${API_BASE}/api/users/profile/${resolvedUser._id}`;
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
    if (e.target) e.target.value = '';
  }
};
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateProfile(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return null;
    }

    setIsLoading(true);
    try {
      // Call onSave to update via parent
      await onSave(formData);
      
      // Update global user state
      updateUser(formData);
      
      // Update resolved user to prevent overwrite
      setResolvedUser(prev => prev ? { ...prev, ...formData } : null);
      
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