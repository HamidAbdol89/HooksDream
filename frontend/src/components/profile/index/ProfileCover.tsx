import React, { useState } from 'react';

interface ProfileCoverProps {
  coverImage?: string;
}

export const ProfileCover: React.FC<ProfileCoverProps> = ({ coverImage }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Cover cố định height */}
      <div
        className="relative h-64 w-full bg-gradient-to-r from-primary/20 to-secondary/20 cursor-pointer"
        onClick={() => coverImage && setIsOpen(true)} // chỉ mở modal khi có ảnh
      >
        {coverImage && (
          <img
            src={coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Modal ảnh */}
      {isOpen && coverImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50"
          onClick={() => setIsOpen(false)}
        >
          <img
            src={coverImage}
            alt="Cover"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </>
  );
};
