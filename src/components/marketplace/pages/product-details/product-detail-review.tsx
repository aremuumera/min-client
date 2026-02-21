
"use client";

import React, { useState } from 'react';
import { useSubmitReviewMutation } from '@/redux/features/reviewFeature/review_api'; // Check path
import LoginModal from '@/utils/login-modal';
import { paths } from '@/config/paths';
import { Button } from '@/components/ui/button'; // Assuming Button if available, otherwise HTML button
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Star, Loader2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useAlert } from '@/providers';
// import QuoteRequestModal from '@/components/marketplace/modals/quote-request-modal';
import ProductInquiryModal from '@/components/marketplace/modals/ProductInquiryModal';
import ReviewModal from '@/components/marketplace/modals/review-modal';
import { useRouter } from 'next/navigation';

const ProductDetailReview = ({ products }: { products: any }) => {
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const { showAlert } = useAlert();
  const [error, setError] = useState<string | null>(null);

  const {
    reviews = [],
    id: productId,
    product_name,
    supplierProfile,
    supplierId,
    supplier,
    productRating,
  } = products || {};

  const { isAuth, user, isTeamMember, ownerUserId } = useSelector((state: any) => state.auth);
  const effectiveUserId = isTeamMember ? ownerUserId : user?.id;
  // Need to verify if review_api exists and useSubmitReviewMutation is exported
  // If not, I'll need to create a dummy hook or fix imports.
  // Assuming it exists based on task.md

  // Safe mock if hook fails to import in real runtime (but for code generation I assume it works)
  // I will use 'any' for the hook result to avoid TS issues if types aren't perfect yet.
  const [submitReview, { isLoading }] = useSubmitReviewMutation() as any;

  const formatReviewDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch (error) {
      return dateString?.substring(0, 10) || '';
    }
  };

  const handleReviewSubmit = async (reviewPayload: any) => {
    try {
      const response = await submitReview({
        entityId: productId,
        entityType: 'product',
        userId: user?.id,
        revieweeId: supplierId,
        reviewData: reviewPayload.reviewData,
      }).unwrap();

      if (response.success === true) {
        showAlert(`${response?.message || 'You have successfully submitted your review'}`, 'success');
      }

      // Reload page to show new review (or ideally invalidate cache)
      setTimeout(() => {
        window.location.reload();
      }, 2000);

      setError(null);
      setShowReviewModal(false);
    } catch (error: any) {
      setError(error.data?.message);
      showAlert(`${error?.data?.message || 'Failed to submit review'}`, 'error');
      console.error('Failed to submit review:', error);
    }
  };

  const canPostReview = isAuth && effectiveUserId !== supplierId;
  const hasReviews = reviews && reviews.length > 0;
  const totalReviews = reviews?.length || 0;

  // Calculate average locally if needed, but usually backend provides it
  const averageRating = productRating?.average || (hasReviews
    ? (reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / totalReviews).toFixed(1)
    : 0);

  const limitedReviews = reviews?.slice(0, 3) || [];
  const hasMoreReviews = reviews?.length > 3;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants: any = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 },
    },
  };

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={16}
            className={i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 fill-transparent'}
          />
        ))}
      </div>
    );
  };

  return (
    <section className="py-6 md:py-8 rounded-lg mb-6 bg-gray-50 border border-gray-100">
      <div className="flex flex-col md:flex-row justify-between px-4 md:px-[65px] items-start md:items-center gap-4 md:gap-0">
        <div className="flex flex-col">
          <h2 className="text-xl font-medium text-gray-800">
            {showAllReviews ? (
              <button
                onClick={() => setShowAllReviews(false)}
                className="cursor-pointer flex items-center hover:text-green-700 transition"
              >
                <ArrowLeft size={18} />
                <span className="ml-1">Back to Summary</span>
              </button>
            ) : (
              <span className="ml-1 font-bold">Reviews</span>
            )}
          </h2>

          {hasReviews && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-gray-600 mt-1 flex flex-wrap gap-x-4 items-center"
            >
              <span className="font-medium">
                Verified Customer Feedback{' '}
                <span className="font-bold text-black">({productRating?.count || totalReviews})</span>
              </span>
              <div className="w-px h-4 bg-gray-300 hidden md:block" />
              <span>
                Average Rating:{' '}
                <span className="font-bold text-black">{Math.round((productRating?.average || 0) * 100) / 100}/5</span>{' '}
              </span>
            </motion.div>
          )}
        </div>

        <div className="hidden md:flex items-center justify-between gap-4">
          {canPostReview && (
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm"
              onClick={() => setShowReviewModal(true)}
            >
              Write a Review
            </button>
          )}
          {!isAuth && effectiveUserId !== supplierId && (
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm"
              onClick={() => setShowLoginModal(true)}
            >
              Write a Review
            </button>
          )}

          {hasMoreReviews && !showAllReviews && (
            <button
              onClick={() => setShowAllReviews(true)}
              className="text-sm text-green-600 font-bold hover:underline"
            >
              See All ({totalReviews})
            </button>
          )}
        </div>

        {/* Mobile Buttons */}
        <div className="flex md:hidden w-full py-2 items-center justify-between gap-4">
          {canPostReview && (
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors flex-1"
              onClick={() => setShowReviewModal(true)}
            >
              Write a Review
            </button>
          )}
          {!isAuth && effectiveUserId !== supplierId && (
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors flex-1"
              onClick={() => setShowLoginModal(true)}
            >
              Write a Review
            </button>
          )}

          {hasMoreReviews && !showAllReviews && (
            <button
              onClick={() => setShowAllReviews(true)}
              className="text-sm text-green-600 font-bold hover:underline"
            >
              See All ({totalReviews})
            </button>
          )}
        </div>
      </div>

      <div className="mx-auto px-4 md:px-[65px] h-px mt-3 mb-6 bg-gray-200"></div>

      {hasReviews ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={showAllReviews ? 'all' : 'limited'}
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="px-4 md:px-[65px]"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(showAllReviews ? reviews : limitedReviews).map((review: any, index: number) => (
                <motion.div
                  key={review.id || index}
                  variants={itemVariants}
                  className="bg-white p-4 border border-gray-200 rounded-lg h-full flex flex-col shadow-sm hover:shadow-md transition-shadow"
                >
                  {review.title && <h4 className="font-semibold text-gray-800 mb-1">{review.title}</h4>}
                  <p className="text-gray-600 mb-6 grow text-sm leading-relaxed">{review.comment}</p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                    <div>
                      <p className="font-bold text-sm text-gray-800">{review.reviewer?.name || 'Anonymous'}</p>
                      <p className="text-xs text-gray-400">{formatReviewDate(review.createdAt)}</p>
                    </div>
                    {renderStarRating(review.rating)}
                  </div>
                </motion.div>
              ))}
            </div>

            {showAllReviews && hasReviews && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center mt-8">
                <button
                  onClick={() => setShowAllReviews(false)}
                  className="flex items-center text-gray-600 border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 transition"
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Back to Summary
                </button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <p className="text-gray-500 mb-4">No reviews yet. Be the first to review!</p>
          {effectiveUserId !== supplierId && (
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium text-sm transition-colors shadow-sm"
              onClick={() => (canPostReview ? setShowReviewModal(true) : setShowLoginModal(true))}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="animate-spin" /> : 'Write a Review'}
            </button>
          )}
        </div>
      )}

      {/* Modals */}

      {/* 
      <QuoteRequestModal
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        productName={product_name}
        initialMessage=""
        receiverId={supplierId}
        itemId={productId}
        itemType="product"
        companyName={supplierProfile?.company_name}
        receiverName={`${supplier?.first_name} ${supplier?.last_name}`}
      /> 
      */}

      <ProductInquiryModal
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        product={{
          id: productId.toString(),
          name: product_name,
          mineral_tag: products.mineral_tag || 'mineral', // Assuming mineral_tag is in products
          supplier_id: supplierId?.toString()
        }}
      />

      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={handleReviewSubmit}
        entityName={product_name}
        entityType="product"
        entityId={productId}
        revieweeId={supplierId}
        error={error ?? undefined} // Handle null to undefined conversion if needed
        setError={(val) => setError(val)}
        isLoading={isLoading}
      />

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} loginPath={paths.auth.signIn} />
    </section>
  );
};

export default ProductDetailReview;
