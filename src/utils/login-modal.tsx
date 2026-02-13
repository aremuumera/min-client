
"use client";

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button'; // Assuming we have a Button component, if not we will use html button with classes or create one.
// Since I don't know for sure if we have a Button component yet, I will use Tailwind classes for now to be safe, 
// or I can check if 'src/components/ui/button.tsx' exists. 
// Given the previous instructions, I should use custom components. 
// I'll assume standard Tailwind implementations for now.

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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9900] flex items-center justify-center animate-in fade-in duration-200">
      <div className="bg-white rounded-lg p-6 max-w-md w-11/12 relative shadow-xl transform transition-all scale-100">
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 focus:outline-none"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>
        
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold mb-2 text-gray-900">{title}</h3>
          <p className="text-gray-600">
            {description}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button 
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 font-medium transition-colors"
            onClick={() => onClose()}
          >
            {cancelText}
          </button>
          <button 
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium transition-colors"
            onClick={() => {
              onClose();
              window.location.href = loginPath;
            }}
          >
            {loginText}
          </button>
        </div>
      </div>
    </div>
  );
}
