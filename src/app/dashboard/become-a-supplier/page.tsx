'use client';

import React from 'react';
import { paths } from '@/config/paths';
import { Button } from '@/components/ui/button';
import { HiOutlineUser } from 'react-icons/hi2';
import { IoDocumentTextOutline } from 'react-icons/io5';
import { PiWarningLight } from 'react-icons/pi';
import { ShieldAlert, Clock, CheckCircle, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useAppSelector } from '@/redux/hooks';
import { useRequestRoleUpgradeMutation, useAppCheckQuery } from '@/redux/features/AuthFeature/auth_api_rtk';
import { useAlert } from '@/providers';

const BecomeASupplierD = () => {
  const { user, appData } = useAppSelector((state) => state.auth);
  const [requestUpgrade, { isLoading: isSubmitting }] = useRequestRoleUpgradeMutation();
  const { refetch: refetchAppCheck } = useAppCheckQuery(undefined);
  const alert = useAlert();

  const userRole = (user?.role || '').toLowerCase();
  const isSupplier = userRole === 'supplier';
  const isBuyer = userRole === 'buyer';
  const isDualRole = userRole === 'buyer_supplier' || userRole === 'both';

  const roleUpgradeStatus = appData?.roleUpgrade?.status || user?.role_upgrade_status || 'none';
  const roleUpgradeReason = appData?.roleUpgrade?.reason || user?.role_upgrade_reason || null;
  const isRoleUpgradePending = roleUpgradeStatus === 'requested';
  const isRoleUpgradeRejected = roleUpgradeStatus === 'rejected';

  const handleRequestUpgrade = async () => {
    try {
      const res: any = await requestUpgrade({ targetRole: 'buyer_supplier' });
      if ('data' in res && res.data?.success) {
        alert.showAlert(res.data.message || 'Role upgrade request submitted to admin for review!', 'success');
        refetchAppCheck();
      } else {
        const errMsg = res.error?.data?.message || res.data?.message || 'Failed to submit role upgrade request';
        alert.showAlert(errMsg, 'error');
      }
    } catch (err: any) {
      alert.showAlert(err?.message || 'Failed to submit request', 'error');
    }
  };

  const BannerInfo = isSupplier
    ? [
        {
          title: 'Post Requests For Quotes (RFQs)',
          description:
            'Source raw materials, specify required mineral grades, and receive competitive bids from verified suppliers.',
          userIcon: <HiOutlineUser className="text-emerald-700 text-[24px]" />,
          buttonText: 'Post RFQ',
          buttonLink: paths.dashboard.rfqs.create,
        },
        {
          title: 'Send Direct Product Inquiries',
          description:
            'Connect directly with other mineral producers, request sample testing, and issue trade inquiries.',
          userIcon: <IoDocumentTextOutline className="text-emerald-700 text-[24px]" />,
          buttonText: 'Browse Catalog',
          buttonLink: paths.marketplace.products,
        },
      ]
    : [
        {
          title: 'Storefront & Product Listings',
          description:
            'Set up your company storefront, list your mineral stock, and display certified lab test results.',
          userIcon: <HiOutlineUser className="text-emerald-700 text-[24px]" />,
          buttonText: 'Verify Info',
          buttonLink: paths.dashboard.companyInfoVerification,
        },
        {
          title: 'Certification & Trade Permits',
          description:
            'Provide government CAC licenses, tax clearances, and mineral export permits for admin review.',
          userIcon: <IoDocumentTextOutline className="text-emerald-700 text-[24px]" />,
          buttonText: 'Upload Docs',
          buttonLink: paths.dashboard.companyInfoVerification,
        },
      ];

  return (
    <div className="py-6 px-4 lg:px-0 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Role Upgrade Center</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
          {isSupplier
            ? 'Activate Buyer Capabilities on Minmeg'
            : 'Activate Supplier Capabilities on Minmeg'}
        </h1>
        <p className="text-sm lg:text-base text-gray-600 font-normal">
          {isSupplier
            ? 'Expand your account to post Requests For Quotes (RFQs), source raw materials, and negotiate directly with verified sellers globally.'
            : 'Expand your account to list mineral products, set up your supplier storefront, and sell directly to verified buyers globally.'}
        </p>
      </div>

      {/* Role Status Banners */}
      {isDualRole && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-bold">Dual Buyer & Supplier Status Active</p>
            <p className="text-xs text-emerald-800">Your account has full dual capabilities unlocked. You can list products and post RFQs.</p>
          </div>
        </div>
      )}

      {isRoleUpgradePending && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Role Upgrade Application Under Review</span>
          </div>
          <p className="text-xs text-amber-800 leading-normal pl-6">
            Your request to activate dual buyer & supplier capabilities is currently being evaluated by an administrator. You will receive an email notification once approved.
          </p>
        </div>
      )}

      {isRoleUpgradeRejected && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-sm text-rose-900">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Role Upgrade Application Declined</span>
          </div>
          <p className="text-xs text-rose-800 leading-normal pl-6">
            <strong>Admin Reason:</strong> {roleUpgradeReason || 'Requirements not met. Please verify your business profile and re-apply.'}
          </p>
        </div>
      )}

      {/* Capabilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {BannerInfo.map((info, index) => (
          <div
            key={index}
            className="flex flex-col justify-between gap-4 rounded-2xl border border-gray-200 p-5 bg-white transition-colors hover:border-gray-300"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                {info.userIcon}
              </div>
              <div className="space-y-1">
                <h2 className="text-base lg:text-lg font-bold text-gray-900">
                  {info.title}
                </h2>
                <p className="text-xs lg:text-sm text-gray-600 leading-relaxed">
                  {info.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Warning Alert */}
      <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 text-amber-900 flex items-center gap-3">
        <PiWarningLight className="text-amber-600 text-xl shrink-0" />
        <p className="text-xs sm:text-sm font-medium">
          Please ensure your corporate documents are uploaded under Business Verification for fast admin approval.
        </p>
      </div>

      {/* Submit Application CTA */}
      {!isDualRole && !isRoleUpgradePending && (
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50 p-5 rounded-2xl border border-gray-200">
          <div className="space-y-0.5 text-center sm:text-left">
            <p className="text-sm font-bold text-gray-900">
              {isSupplier ? 'Ready to Activate Buyer Capabilities?' : 'Ready to Activate Supplier Capabilities?'}
            </p>
            <p className="text-xs text-gray-600">Send your dual-role upgrade request directly to platform admins for review.</p>
          </div>

          <Button
            onClick={handleRequestUpgrade}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl transition-colors shrink-0 disabled:opacity-50"
          >
            {isSubmitting
              ? 'Submitting Application...'
              : isSupplier
              ? 'Submit Buyer Upgrade Request'
              : 'Submit Supplier Upgrade Request'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default BecomeASupplierD;
