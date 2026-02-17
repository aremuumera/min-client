
"use client";

import { useAlert } from "@/providers/alert-provider";
import {
  useCheckSavedStatusQuery,
  useToggleSavedItemMutation,
  useGetSavedItemsQuery
} from "@/redux/features/savedFeature/saved_api";
// import LoginModal from "@/components/common/login-modal";
import { useState, useRef } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { useSelector } from "react-redux";
import { usePathname } from "next/navigation";
import { RootState } from "@/redux/store"; // Assuming RootState is exported from store
import { Loader2 } from "lucide-react";

interface Product {
  id: string | number;
  rfqId?: string | number;
  [key: string]: any;
}

interface ToggleSaveButtonProps {
  products: Product;
  setShowLoginModal: (show: boolean) => void;
}

const ToggleSaveButton = ({ products, setShowLoginModal }: ToggleSaveButtonProps) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const { showAlert } = useAlert();
  // Use 'any' for now if RootState is not fully typed or migration is partial, 
  // but ideally we should use RootState.
  const { user, isAuth, isTeamMember, ownerUserId } = useSelector((state: any) => state.auth);
  const effectiveUserId = isTeamMember ? ownerUserId : user?.id;
  const pathname = usePathname();
  const { id, rfqId } = products;
  const effectiveId = id || rfqId || products?._id;

  const productPATHENMAE = ['/dashboard/products/all-mineral-cp', '/dashboard/products/details'];
  const rfqPATHENMAE = ['/dashboard/products/rfq-products', '/dashboard/rfqs/details'];

  // Determine item type based on current route
  const getItemType = () => {
    if (rfqPATHENMAE.some(path => pathname?.includes(path))) {
      return 'rfq';
    }
    return 'product';
  };

  const itemType = getItemType();

  // 1. Check initial saved status
  const { data: savedStatus, refetch: refetchSavedStatus } = useCheckSavedStatusQuery(
    { userId: effectiveUserId, itemId: String(effectiveId), itemType },
    {
      skip: !effectiveUserId,
      refetchOnMountOrArgChange: true
    }
  );

  // 2. Get all saved items for cache consistency
  const { data: savedItems } = useGetSavedItemsQuery({
    userId: effectiveUserId
  }, {
    skip: !effectiveUserId,
    refetchOnMountOrArgChange: true,
    pollingInterval: 30000
  });

  // 3. Toggle mutation with optimistic updates
  const [toggleSavedItem, { isLoading }] = useToggleSavedItemMutation();

  // Determine if item is saved
  const isSaved = savedStatus?.isSaved ||
    (savedItems?.length > 0 && savedItems?.some((item: any) =>
      item.itemId == effectiveId && item.itemType === itemType
    ));

  // Track if we've shown the login alert
  const loginAlertShownRef = useRef(false);

  // Use direct handler without memoization for troubleshooting
  const handleToggleSave = (e: React.MouseEvent) => {
    // Force stop propagation
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    // Check if the user is authenticated
    if (!isAuth) {
      if (!loginAlertShownRef.current) {
        setShowLoginModal(true);
        loginAlertShownRef.current = true;
        setTimeout(() => {
          loginAlertShownRef.current = false;
        }, 1000);
      }
      return;
    }

    if (!user?.id) {
      console.error("User is authenticated but user ID is missing");
      showAlert("Error accessing user information", "error");
      return;
    }

    const newSavedState = !isSaved;

    try {
      toggleSavedItem({
        itemId: String(effectiveId),
        itemType,
        userId: effectiveUserId
      }).unwrap()
        .then((result) => {
          refetchSavedStatus();
          showAlert(
            `Item ${newSavedState ? 'saved' : 'removed from saved items'}`,
            "success"
          );
        })
        .catch((error) => {
          console.error("Toggle save error:", error);
          showAlert(
            error?.data?.message || "Error updating saved status",
            "error"
          );
        });
    } catch (error: any) {
      console.error("Unexpected error in toggle save:", error);
      showAlert(
        error?.data?.message || "Error updating saved status",
        "error"
      );
    }
  };

  return (
    <div
      ref={buttonRef}
      onClick={handleToggleSave}
      style={{
        cursor: isLoading ? 'wait' : 'pointer',
        position: 'relative',
        zIndex: 10,
      }}
      className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors"
      data-testid="toggle-save-button"
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : isSaved ? (
        <FaHeart className="text-red-500 text-sm sm:text-xl" />
      ) : (
        <FaRegHeart className="text-sm sm:text-xl" />
      )}
    </div>
  );
};

export default ToggleSaveButton;
