"use client";

import React from "react";
import Link from "next/link";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Clock,
  Sparkles,
  Lock,
  ChevronRight,
  RefreshCw,
  Building2,
  Receipt,
  FileCheck,
  BellRing,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MerchantWalletPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-800 p-6 sm:p-8 text-white">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                <Wallet className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Merchant Wallet
              </h1>
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                Coming Soon
              </span>
            </div>
            <p className="text-neutral-400 text-sm max-w-2xl">
              Secure multi-currency wallet for mineral merchants, enabling seamless escrow settlements, trade invoicing, and automated payouts upon inspection verification.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link href="/dashboard">
              <Button variant="outlined" className="border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-white text-xs">
                Back to Overview
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Preview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Available Balance Preview Card */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-500 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider">Available Balance</span>
            <span className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded font-medium border border-neutral-200">
              Preview
            </span>
          </div>
          <div className="space-y-1 mb-6">
            <div className="text-3xl font-bold text-neutral-900">$0.00 <span className="text-sm font-medium text-neutral-400">USD</span></div>
            <p className="text-xs text-neutral-500">Live balance activation coming in next update</p>
          </div>
          <div className="flex items-center gap-2 pt-4 border-t border-neutral-100">
            <Button disabled className="w-1/2 bg-neutral-100 text-neutral-400 border border-neutral-200 text-xs py-2 flex items-center justify-center gap-1.5 cursor-not-allowed">
              <ArrowDownLeft size={14} /> Deposit
            </Button>
            <Button disabled className="w-1/2 bg-neutral-100 text-neutral-400 border border-neutral-200 text-xs py-2 flex items-center justify-center gap-1.5 cursor-not-allowed">
              <ArrowUpRight size={14} /> Withdraw
            </Button>
          </div>
        </div>

        {/* Escrow Funds Preview Card */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-500 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider">Escrow Holdings</span>
            <div className="p-1 bg-emerald-50 text-emerald-600 rounded">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="space-y-1 mb-6">
            <div className="text-3xl font-bold text-neutral-900">$0.00 <span className="text-sm font-medium text-neutral-400">USD</span></div>
            <p className="text-xs text-neutral-500">Locked funds awaiting trade completion</p>
          </div>
          <div className="flex items-center justify-between text-xs text-neutral-500 pt-4 border-t border-neutral-100">
            <span>Protected Trades</span>
            <span className="font-semibold text-neutral-700">0 Active</span>
          </div>
        </div>

        {/* Pending Settlements Preview Card */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-500 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Payouts</span>
            <div className="p-1 bg-amber-50 text-amber-600 rounded">
              <Clock size={16} />
            </div>
          </div>
          <div className="space-y-1 mb-6">
            <div className="text-3xl font-bold text-neutral-900">$0.00 <span className="text-sm font-medium text-neutral-400">USD</span></div>
            <p className="text-xs text-neutral-500">Invoices under inspection verification</p>
          </div>
          <div className="flex items-center justify-between text-xs text-neutral-500 pt-4 border-t border-neutral-100">
            <span>Pending Invoices</span>
            <span className="font-semibold text-neutral-700">0 Pending</span>
          </div>
        </div>
      </div>

      {/* Feature Showcase Grid */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              What to Expect from Minmeg Merchant Wallet
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              We are building a robust financial engine tailored specifically for global mineral trading.
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-200">
            <Lock size={12} /> Bank-Grade Security
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature 1 */}
          <div className="p-5 rounded-xl border border-neutral-100 bg-neutral-50/50 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <ShieldCheck size={20} />
            </div>
            <h3 className="text-sm font-bold text-neutral-900">Trade Escrow Protection</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Buyer funds are held safely in escrow until quality inspection reports and trade documentation are verified by appointed inspectors.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-5 rounded-xl border border-neutral-100 bg-neutral-50/50 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Building2 size={20} />
            </div>
            <h3 className="text-sm font-bold text-neutral-900">Multi-Currency Accounts</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Receive and hold funds across major international currencies (USD, EUR, NGN) to eliminate forex friction on international shipments.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-5 rounded-xl border border-neutral-100 bg-neutral-50/50 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Receipt size={20} />
            </div>
            <h3 className="text-sm font-bold text-neutral-900">Automated Invoice Settlement</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Directly match trade invoices with buyer deposits and release milestone payments automatically as stages progress.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-5 rounded-xl border border-neutral-100 bg-neutral-50/50 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <FileCheck size={20} />
            </div>
            <h3 className="text-sm font-bold text-neutral-900">Complete Audit Trail</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Export comprehensive transaction history and verification certificates directly for tax, compliance, and corporate accounting.
            </p>
          </div>
        </div>
      </div>

      {/* Coming Soon Notification Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-neutral-900 border border-emerald-800/40 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl shrink-0 text-emerald-400">
            <BellRing className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Wallet Integration is Under Active Development
            </h3>
            <p className="text-xs text-neutral-300 mt-1 max-w-xl">
              Our engineering team is finalizing secure payment gateway integrations and compliance controls. You will receive an in-app alert as soon as full wallet capabilities are live for your merchant account.
            </p>
          </div>
        </div>

        <Link href="/dashboard">
          <Button className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-6 whitespace-nowrap border-none">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
