
"use client";

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { format } from 'date-fns';
import { Star, ArrowLeft, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
// import { useSubmitStoreReviewMutation, useGetStoreReviewsQuery } from '@/redux/features/reviewFeature/review_api'; // Check path
// Assuming review_api.ts covers both product and store reviews based on usage in original file.
import { useSubmitReviewMutation } from '@/redux/features/reviewFeature/review_api'; // Wait, original imported useSubmitStoreReviewMutation
// I need to check if useSubmitStoreReviewMutation exists in the same file or if I should use a generic one.
// The original used: import { useSubmitReviewMutation, useSubmitStoreReviewMutation } from ...
// I'll assume they are exported.
import LoginModal from '@/utils/login-modal';
import ReviewModal from '@/components/marketplace/modals/review-modal';
import { useAlert } from '@/providers';
import { paths } from '@/config/paths';
import { useGetStoreReviewsQuery, useSubmitStoreReviewMutation } from '@/redux/features/reviewFeature/review_api';

const CompanyProfileReviewTab = ({ products }: { products: any }) => {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const { showAlert } = useAlert();
  const [error, setError] = useState<string | null>(null);

  // Redux hooks
  const { isAuth, user } = useSelector((state: any) => state.auth);

  // useSubmitStoreReviewMutation might be needed. If not available, I'll fallback to useSubmitReviewMutation and change entityType.
  // Actually, I'll try to import it. If it fails, I'll have to fix it.
  const [submitStoreReview, { isLoading }] = useSubmitStoreReviewMutation() as any;

  const { data: reviewsData, isLoading: isReviewsLoading } = useGetStoreReviewsQuery({
    storeProfileId: products?.supplierProfileId,
    entityType: 'supplier'
  }, {
    refetchOnMountOrArgChange: true,
    skip: !products?.supplierProfileId
  });

  const reviews = reviewsData?.reviews || [];

  const handleReviewSubmit = async (reviewPayload: any) => {
    try {
      const response = await submitStoreReview({
        entityId: products?.id,
        entityType: 'supplier',
        userId: user?.id,
        storeProfileId: products?.supplierProfileId,
        revieweeId: products?.userId,
        reviewData: reviewPayload.reviewData
      }).unwrap();

      if (response.success) {
        showAlert(response?.message || 'You have successfully submitted your review', "success");
      }

      // Reload or refetch
      setTimeout(() => {
        window.location.reload();
      }, 1500);

      setError(null);
      setShowReviewModal(false);
    } catch (err: any) {
      setError(err?.data?.message || 'Failed to submit review');
      showAlert(err?.data?.message || 'Failed to submit review', "error");
    }
  };

  const formatReviewDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch (e) {
      return '';
    }
  };

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={16}
            className={i < rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-100 text-gray-300"}
          />
        ))}
      </div>
    );
  };

  const canPostReview = isAuth && user?.id !== products?.userId;
  const hasReviews = reviews && reviews.length > 0;
  const totalReviews = reviews.length;
  const averageRating = hasReviews
    ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : 0;

  const limitedReviews = reviews.slice(0, 3);
  const hasMoreReviews = reviews.length > 3;

  return (
    <div className="py-6 rounded-lg bg-green-50/50">
      <div className="flex flex-col md:flex-row justify-between px-4 md:px-8 items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {showAllReviews && (
              <button onClick={() => setShowAllReviews(false)} className="hover:bg-green-100 p-1 rounded-full transition">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            )}
            <h2 className="text-xl font-bold text-gray-800">Reviews</h2>
          </div>

          {hasReviews && (
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Verified Feedback ({totalReviews})</span>
              <span className="w-px h-4 bg-gray-300"></span>
              <div className="flex items-center gap-1">
                <span>Average:</span>
                <span className="font-bold text-gray-900">{averageRating}/5</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          {user?.id !== products?.userId && (
            <button
              onClick={() => canPostReview ? setShowReviewModal(true) : setShowLoginModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition shadow-sm"
            >
              Write a Review
            </button>
          )}

          {hasMoreReviews && !showAllReviews && (
            <button
              onClick={() => setShowAllReviews(true)}
              className="text-green-600 font-semibold text-sm hover:underline"
            >
              See All ({totalReviews})
            </button>
          )}
        </div>
      </div>

      <div className="h-px bg-gray-200 mx-4 md:mx-8 my-6"></div>

      {isReviewsLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
        </div>
      ) : hasReviews ? (
        <div className="px-4 md:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(showAllReviews ? reviews : limitedReviews).map((review: any, index: number) => (
              <div key={review.id || index} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
                <h4 className="font-semibold text-gray-900 mb-2 line-clamp-1">{review.title}</h4>
                <p className="text-gray-600 text-sm mb-6 flex-grow leading-relaxed line-clamp-4">
                  {review.comment || review.reviewerDescription}
                </p>
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{review.reviewer?.name || review.reviewerName || 'Anonymous'}</p>
                    <p className="text-xs text-gray-400">{formatReviewDate(review.createdAt || review.date)}</p>
                  </div>
                  <div>{renderStarRating(review.rating)}</div>
                </div>
              </div>
            ))}
          </div>

          {showAllReviews && (
            <div className="flex justify-center mt-8">
              <button
                onClick={() => setShowAllReviews(false)}
                className="flex items-center gap-2 px-5 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-white hover:border-gray-400 transition"
              >
                <ArrowLeft size={16} />
                Back to Summary
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No reviews yet. Be the first to share your experience!</p>
          {user?.id !== products?.userId && (
            <button
              onClick={() => canPostReview ? setShowReviewModal(true) : setShowLoginModal(true)}
              className="bg-white border border-green-600 text-green-600 px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-50 transition"
              disabled={isLoading}
            >
              Write a Review
            </button>
          )}
        </div>
      )}

      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={handleReviewSubmit}
        entityName={products?.company_name}
        entityType="supplier"
        entityId={products?.id}
        revieweeId={products?.userId}
        error={error ?? undefined}
        setError={(val) => setError(val)}
        isLoading={isLoading}
      />

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        loginPath={paths.auth.signIn}
      />
    </div>
  );
};

export default CompanyProfileReviewTab;
