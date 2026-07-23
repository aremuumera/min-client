
"use client";

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { format } from 'date-fns';
import { Star, MessageSquare, Plus, Loader2, ShieldCheck, User as UserIcon } from 'lucide-react';
import LoginModal from '@/utils/login-modal';
import ReviewModal from '@/components/marketplace/modals/review-modal';
import { useAlert } from '@/providers';
import { paths } from '@/config/paths';
import { useGetStoreReviewsQuery, useSubmitStoreReviewMutation } from '@/redux/features/reviewFeature/review_api';

const CompanyProfileReviewTab = ({ products }: { products: any }) => {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { showAlert } = useAlert();
  const [error, setError] = useState<string | null>(null);

  const { isAuth, user } = useSelector((state: any) => state.auth);
  const [submitStoreReview, { isLoading }] = useSubmitStoreReviewMutation() as any;

  const { data: reviewsData, isLoading: isReviewsLoading } = useGetStoreReviewsQuery(
    {
      storeProfileId: products?.supplierProfileId,
      entityType: 'supplier',
    },
    {
      refetchOnMountOrArgChange: true,
      skip: !products?.supplierProfileId,
    }
  );

  const reviews = reviewsData?.reviews || [];

  const handleReviewSubmit = async (reviewPayload: any) => {
    try {
      const response = await submitStoreReview({
        userId: user?.id,
        storeProfileId: products?.supplierProfileId,
        reviewData: reviewPayload.reviewData,
      }).unwrap();

      if (response.success) {
        showAlert(response?.message || 'You have successfully submitted your review', 'success');
      }

      setTimeout(() => {
        window.location.reload();
      }, 1200);

      setError(null);
      setShowReviewModal(false);
    } catch (err: any) {
      const msg = err?.data?.message || 'Failed to submit review';
      setError(msg);
      showAlert(msg, 'error');
    }
  };

  const formatReviewDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (e) {
      return 'Recently';
    }
  };

  const renderStarRating = (rating: number, size = 16) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={star <= rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-100 text-gray-200'}
        />
      ))}
    </div>
  );

  const canPostReview = isAuth && user?.id !== products?.userId;
  const totalReviews = reviews.length;
  const avgRatingNum =
    totalReviews > 0
      ? reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / totalReviews
      : Number(products?.ratingAverage || 0);
  const averageRating = avgRatingNum.toFixed(1);

  // Rating counts breakdown (5 star down to 1 star)
  const starCounts = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r: any) => Math.round(r.rating) === star).length;
    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
    return { star, count, percentage };
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2 sm:px-6 md:px-0">
      {/* Review Hero Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Average Rating Score */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left min-w-[200px]">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Overall Rating</span>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-gray-900">{averageRating}</span>
              <span className="text-gray-400 text-lg font-bold">/ 5.0</span>
            </div>
            <div className="my-2">{renderStarRating(Math.round(avgRatingNum), 20)}</div>
            <span className="text-xs font-semibold text-gray-500">Based on {totalReviews} verified reviews</span>
          </div>

          {/* Star Distribution Progress Bars */}
          <div className="w-full max-w-md space-y-2 border-y lg:border-y-0 lg:border-x border-gray-100 py-4 lg:py-0 lg:px-8">
            {starCounts.map(({ star, count, percentage }) => (
              <div key={star} className="flex items-center gap-3 text-xs">
                <span className="w-12 font-bold text-gray-600 flex items-center gap-1">
                  {star} <Star size={12} className="fill-amber-400 text-amber-400" />
                </span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-right font-medium text-gray-400">{count}</span>
              </div>
            ))}
          </div>

          {/* Write Review Action Button */}
          <div className="flex flex-col items-center lg:items-end w-full lg:w-auto">
            {user?.id !== products?.userId && (
              <button
                onClick={() => (canPostReview ? setShowReviewModal(true) : setShowLoginModal(true))}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-xl transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Write a Store Review</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Review Feed List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-green-600" />
            <span>Customer Feedback ({totalReviews})</span>
          </h3>
        </div>

        {isReviewsLoading ? (
          <div className="flex justify-center py-12 bg-white rounded-2xl border border-gray-100">
            <Loader2 className="w-7 h-7 text-green-600 animate-spin" />
          </div>
        ) : reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review: any, index: number) => (
              <div
                key={review.id || index}
                className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-gray-200 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-50 text-green-700 flex items-center justify-center font-bold text-sm border border-green-100">
                      {review.reviewer?.business_name
                        ? review.reviewer.business_name.charAt(0).toUpperCase()
                        : <UserIcon className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900 text-sm">
                          {review.reviewer?.business_name || review.reviewerName || 'Verified Buyer'}
                        </h4>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-[10px] font-bold border border-green-200/50">
                          <ShieldCheck className="w-3 h-3" /> Verified Trade
                        </span>
                      </div>
                      <span className="text-xs font-medium text-gray-400">{formatReviewDate(review.createdAt)}</span>
                    </div>
                  </div>

                  <div className="shrink-0">{renderStarRating(review.rating, 15)}</div>
                </div>

                {review.title && <h5 className="font-bold text-gray-800 text-sm mb-1">{review.title}</h5>}
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{review.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200 p-8">
            <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h4 className="font-bold text-gray-900 text-base mb-1">No Reviews Yet</h4>
            <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
              Be the first partner to leave verified feedback for <span className="font-semibold text-gray-800">{products?.company_name}</span>.
            </p>
            {user?.id !== products?.userId && (
              <button
                onClick={() => (canPostReview ? setShowReviewModal(true) : setShowLoginModal(true))}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-50 text-green-700 hover:bg-green-100 font-bold text-sm rounded-xl transition-all border border-green-200/80 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Write First Review</span>
              </button>
            )}
          </div>
        )}
      </div>

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

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} loginPath={paths.auth.signIn} />
    </div>
  );
};

export default CompanyProfileReviewTab;
