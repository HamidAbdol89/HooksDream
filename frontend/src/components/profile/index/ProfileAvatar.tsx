import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';

interface ProfileAvatarProps {
  avatar?: string;
  displayName: string;
  className?: string;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  avatar,
  displayName,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Avatar clickable */}
      <div className="relative -mt-20 md:-mt-16 flex justify-center">
        <div onClick={() => setIsOpen(true)} className="cursor-pointer">
          <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
            <AvatarImage src={avatar} alt={displayName} />
            <AvatarFallback className="text-2xl">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Modal ảnh */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50"
          onClick={() => setIsOpen(false)}
        >
          <img
            src={avatar}
            alt={displayName}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </>
  );
};
