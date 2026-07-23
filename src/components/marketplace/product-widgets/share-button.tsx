
"use client";

import { useRef, useEffect, useState } from "react";
import { FaFacebook, FaLinkedin, FaTelegram, FaTwitter, FaWhatsapp } from "react-icons/fa6";
import { FiShare2 } from "react-icons/fi";
import { MdContentCopy } from "react-icons/md";

interface ShareButtonProps {
  productName: string;
}

const ShareButton = ({ productName }: ShareButtonProps) => {
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [position, setPosition] = useState<'right' | 'left'>('right');
  const popupRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const toggleSharePopup = () => {
    if (!showSharePopup && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;
      if (rect.left + 260 > screenWidth) {
        setPosition('right');
      } else {
        setPosition('left');
      }
    }
    setShowSharePopup(!showSharePopup);
  };

  const copyToClipboard = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      });
    }
  };

  // Handle clicks outside the dropdown to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        showSharePopup && 
        popupRef.current && 
        !popupRef.current.contains(event.target as Node) &&
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowSharePopup(false);
      }
    }
    
    if (showSharePopup) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSharePopup]);

  // Social media share URLs
  const getShareLinks = () => {
    if (typeof window === 'undefined') return { facebook: '', twitter: '', whatsapp: '', linkedin: '', telegram: '' };
    
    const url = window.location.href;
    return {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent('Check out this product: ' + productName)}&url=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent('Check out this product: ' + productName + ' ' + url)}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(productName)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent('Check out this product: ' + productName)}`
    };
  };

  const shareLinks = getShareLinks();
  
  return (
    <div className="relative inline-block">
      <button 
        ref={buttonRef}
        onClick={toggleSharePopup}
        className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors p-1.5 rounded-full hover:bg-gray-100"
        title="Share"
      >
        <FiShare2 className="text-lg" />
      </button>
      
      {showSharePopup && (
        <div 
          ref={popupRef} 
          className={`absolute ${position === 'right' ? 'right-0 left-auto' : 'left-0 right-auto'} top-full mt-2 bg-white rounded-xl shadow-xl z-50 w-64 py-3 px-4 border border-gray-200 max-w-[calc(100vw-32px)]`}
        >
          <h4 className="text-sm font-semibold text-gray-800 mb-2">Share via</h4>
          
          <div className="flex flex-wrap gap-2.5 mb-3">
            <a 
              href={shareLinks.facebook} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-all hover:scale-105"
            >
              <FaFacebook />
            </a>
            <a 
              href={shareLinks.twitter} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center hover:bg-sky-600 transition-all hover:scale-105"
            >
              <FaTwitter />
            </a>
            <a 
              href={shareLinks.whatsapp} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-all hover:scale-105"
            >
              <FaWhatsapp />
            </a>
            <a 
              href={shareLinks.linkedin} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center hover:bg-blue-800 transition-all hover:scale-105"
            >
              <FaLinkedin />
            </a>
            <a 
              href={shareLinks.telegram} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center hover:bg-sky-700 transition-all hover:scale-105"
            >
              <FaTelegram />
            </a>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={copyToClipboard} 
              className="flex items-center justify-center gap-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors rounded-lg px-3 py-2 w-full"
            >
              <MdContentCopy size={15} />
              {copySuccess ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareButton;
