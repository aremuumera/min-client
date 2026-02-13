'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MdClose } from 'react-icons/md';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  loginPath?: string;
  title?: string;
  description?: string;
  cancelText?: string;
  loginText?: string;
}

export default function LoginModal({
  isOpen,
  onClose,
  loginPath = '/auth/sign-in',
  title = 'Login Required',
  description = 'Please log in to your account to perform this action.',
  cancelText = 'Cancel',
  loginText = 'Login Now'
}: LoginModalProps) {

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9900] flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-11/12 relative text-black">
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          aria-label="Close modal"
        >
          <MdClose size={24} />
        </button>
        
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-gray-600">
            {description}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button 
            variant="outlined"
            className="w-full"
            onClick={onClose}
          >
            {cancelText}
          </Button>
          <Button 
            variant="contained"
            className="w-full"
            onClick={() => {
              onClose();
              window.location.href = loginPath;
            }}
          >
            {loginText}
          </Button>
        </div>
      </div>
    </div>
  );
}
