
"use client";

import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { useSelector } from 'react-redux';
import LoginModal from '@/utils/login-modal';
import { paths } from '@/config/paths';
import { Loader2 } from 'lucide-react';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  entityName?: string;
  entityType?: string;
  entityId?: string | number;
  revieweeId?: string | number;
  error?: string | null;
  setError?: (val: string | null) => void;
  isLoading?: boolean;
}

const ReviewModal = ({
  isOpen,
  onClose,
  onSubmit,
  entityName = '',
  entityType = '',
  entityId = '',
  revieweeId = '',
  error = null,
  setError,
  isLoading
}: ReviewModalProps) => {
  const [reviewData, setReviewData] = useState({
    title: '',
    comment: '',
    rating: 0
  });

  const [validationErrors, setValidationErrors] = useState<any>({});
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Redux auth state
  const { user, isAuth } = useSelector((state: any) => state.auth);

  if (!isOpen) return null;

  const handleClose = () => {
    setReviewData({
      title: '',
      comment: '',
      rating: 0
    });
    setValidationErrors({});
    if (setError) setError(null);
    onClose();
  };

  const handleRatingChange = (newRating: number) => {
    setReviewData({ ...reviewData, rating: newRating });
    if (validationErrors.rating) {
      setValidationErrors({ ...validationErrors, rating: '' });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setReviewData({ ...reviewData, [name]: value });

    if (validationErrors[name]) {
      setValidationErrors({ ...validationErrors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!reviewData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!reviewData.comment.trim()) {
      newErrors.comment = 'Comment is required';
    }

    if (reviewData.rating === 0) {
      newErrors.rating = 'Please select a rating';
    }

    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!isAuth) {
      setShowLoginModal(true);
      return;
    }

    if (validateForm()) {
      onSubmit({
        userId: user?.id,
        entityId,
        entityType: entityType || 'product',
        revieweeId,
        reviewData
      });
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[11000] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 max-w-xl w-full relative shadow-xl">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            disabled={isLoading}
          >
            <X size={24} />
          </button>

          <div className="mb-6 text-center sm:text-left">
            {error && <p className="text-red-500 text-sm mb-2 text-center bg-red-50 p-2 rounded">{error}</p>}
            <h3 className="text-xl font-semibold mb-2">Write a Review</h3>
            <p className="text-gray-600">
              Share your experience with <span className="font-medium">{entityName}</span>
            </p>
          </div>

          {/* Rating */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">Rating</p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingChange(star)}
                  className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    className={`w-8 h-8 ${star <= reviewData.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                  />
                </button>
              ))}
            </div>
            {validationErrors.rating && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.rating}</p>
            )}
          </div>

          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Review Title</label>
            <input
              type="text"
              name="title"
              value={reviewData.title}
              onChange={handleInputChange}
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none ${validationErrors.title ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Summarize your experience"
            />
            {validationErrors.title && <p className="text-red-500 text-xs mt-1">{validationErrors.title}</p>}
          </div>

          {/* Comment */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Review</label>
            <textarea
              rows={4}
              name="comment"
              value={reviewData.comment}
              onChange={handleInputChange}
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none ${validationErrors.comment ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Share your experience to help others make better choices"
            />
            {validationErrors.comment && <p className="text-red-500 text-xs mt-1">{validationErrors.comment}</p>}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              className="w-full py-2 border border-gray-300 rounded hover:bg-gray-50 transition font-medium"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-medium flex items-center justify-center gap-2"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Submit Review'}
            </button>
          </div>
        </div>
      </div>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        loginPath={paths.auth.signIn}
      />
    </>
  );
};

export default ReviewModal;
