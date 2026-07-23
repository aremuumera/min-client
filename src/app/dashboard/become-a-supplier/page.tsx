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
  const isDualRole = userRole === 'buyer_supplier' || userRole === 'both' || userRole === 'supplier';

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

  const BannerInfo = [
    {
      title: 'Company Information',
      description:
        'Verify your corporate details, address, and contact information to establish seller identity.',
      userIcon: <HiOutlineUser className="text-emerald-700 text-[24px]" />,
      buttonText: 'Verify Info',
      buttonLink: paths.dashboard.companyInfoVerification,
    },
    {
      title: 'Certification Documents',
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
          Want to Become a Supplier on Minmeg?
        </h1>
        <p className="text-sm lg:text-base text-gray-600 font-normal">
          Expand your account to list mineral products, submit bids on RFQs, and sell directly to verified buyers globally.
        </p>
      </div>

      {/* Role Status Banners */}
      {isDualRole && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-bold">Dual Buyer & Supplier Status Active</p>
            <p className="text-xs text-emerald-800">Your account already has full supplier capabilities unlocked.</p>
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
            Your request to activate dual supplier capabilities is currently being evaluated by an administrator. You will receive an email notification once approved.
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

      {/* Verification Steps Grid */}
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

            {/* <div className="pt-2">
              <Link
                href={info.buttonLink}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                {info.buttonText} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div> */}
          </div>
        ))}
      </div>

      {/* Warning Alert */}
      <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 text-amber-900 flex items-center gap-3">
        <PiWarningLight className="text-amber-600 text-xl shrink-0" />
        <p className="text-xs sm:text-sm font-medium">
          Please ensure your business address matches the official information on your registered government documents.
        </p>
      </div>

      {/* Submit Application CTA */}
      {!isDualRole && !isRoleUpgradePending && (
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50 p-5 rounded-2xl border border-gray-200">
          <div className="space-y-0.5 text-center sm:text-left">
            <p className="text-sm font-bold text-gray-900">Ready to Submit Supplier Upgrade?</p>
            <p className="text-xs text-gray-600">Send your role request directly to platform admins for review.</p>
          </div>

          <Button
            onClick={handleRequestUpgrade}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl transition-colors shrink-0 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting Application...' : 'Submit Supplier Upgrade Request'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default BecomeASupplierD;
