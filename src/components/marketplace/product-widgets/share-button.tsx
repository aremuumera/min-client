
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
  const popupRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  const toggleSharePopup = () => {
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
    
    // Add event listener when the popup is shown
    if (showSharePopup) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    // Cleanup the event listener
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
    <div className="relative">
      <button 
        ref={buttonRef}
        onClick={toggleSharePopup}
        className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors"
      >
        <FiShare2 className="text-xl" />
      </button>
      
      {showSharePopup && (
        <div ref={popupRef} className="absolute left-0 top-full mt-2 bg-white rounded-lg shadow-lg z-20 w-64 py-3 px-4 border border-gray-100">
          <h4 className="text-sm font-medium mb-2">Share via</h4>
          
          <div className="flex flex-wrap gap-3 mb-3">
            <a 
              href={shareLinks.facebook} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors"
            >
              <FaFacebook />
            </a>
            <a 
              href={shareLinks.twitter} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center hover:bg-sky-600 transition-colors"
            >
              <FaTwitter />
            </a>
            <a 
              href={shareLinks.whatsapp} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors"
            >
              <FaWhatsapp />
            </a>
            <a 
              href={shareLinks.linkedin} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center hover:bg-blue-800 transition-colors"
            >
              <FaLinkedin />
            </a>
            <a 
              href={shareLinks.telegram} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center hover:bg-sky-700 transition-colors"
            >
              <FaTelegram />
            </a>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={copyToClipboard} 
              className="flex items-center justify-center gap-1 text-sm bg-gray-100 hover:bg-gray-200 transition-colors rounded px-3 py-1.5 w-full"
            >
              <MdContentCopy size={16} />
              {copySuccess ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareButton;
