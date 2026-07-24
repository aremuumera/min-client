"use client";

import { useRef, useEffect, useState } from "react";
import { FaFacebook, FaLinkedin, FaTelegram, FaTwitter, FaWhatsapp } from "react-icons/fa6";
import { FiShare2 } from "react-icons/fi";
import { MdContentCopy } from "react-icons/md";
import { X } from "lucide-react";

interface ShareButtonProps {
  productName: string;
}

const ShareButton = ({ productName }: ShareButtonProps) => {
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const toggleSharePopup = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // On mobile devices, attempt native Web Share API if available
    if (typeof navigator !== 'undefined' && navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      navigator
        .share({
          title: productName,
          text: `Check out this product: ${productName}`,
          url: typeof window !== 'undefined' ? window.location.href : '',
        })
        .catch(() => {
          setShowSharePopup((prev) => !prev);
        });
      return;
    }

    setShowSharePopup((prev) => !prev);
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
        <>
          {/* Mobile backdrop */}
          <div
            className="sm:hidden fixed inset-0 bg-black/30 backdrop-blur-xs z-40"
            onClick={() => setShowSharePopup(false)}
          />

          {/* Share container: fixed bottom card on mobile, absolute popover on desktop */}
          <div
            ref={popupRef}
            className="fixed sm:absolute bottom-4 sm:bottom-full left-4 sm:left-auto right-4 sm:right-0 mb-0 sm:mb-2 bg-white rounded-2xl sm:rounded-xl shadow-2xl z-50 py-4 px-4 border border-gray-200 w-auto sm:w-60 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900">Share Product</h4>
              <button
                onClick={() => setShowSharePopup(false)}
                className="sm:hidden text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center justify-start gap-3 mb-4 overflow-x-auto py-1 no-scrollbar">
              <a
                href={shareLinks.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-all hover:scale-105 shrink-0 text-lg"
                title="WhatsApp"
              >
                <FaWhatsapp />
              </a>
              <a
                href={shareLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-all hover:scale-105 shrink-0 text-lg"
                title="Facebook"
              >
                <FaFacebook />
              </a>
              <a
                href={shareLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-sky-500 text-white flex items-center justify-center hover:bg-sky-600 transition-all hover:scale-105 shrink-0 text-lg"
                title="Twitter / X"
              >
                <FaTwitter />
              </a>
              <a
                href={shareLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-blue-700 text-white flex items-center justify-center hover:bg-blue-800 transition-all hover:scale-105 shrink-0 text-lg"
                title="LinkedIn"
              >
                <FaLinkedin />
              </a>
              <a
                href={shareLinks.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-sky-600 text-white flex items-center justify-center hover:bg-sky-700 transition-all hover:scale-105 shrink-0 text-lg"
                title="Telegram"
              >
                <FaTelegram />
              </a>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <button
                onClick={copyToClipboard}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs text-gray-800 font-semibold transition-colors"
              >
                <MdContentCopy className="text-sm" />
                <span>{copySuccess ? "Copied to Clipboard!" : "Copy Product Link"}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ShareButton;
