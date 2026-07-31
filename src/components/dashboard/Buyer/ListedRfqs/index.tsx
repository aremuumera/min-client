"use client";

import React, { useState } from "react";
import { TextField } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { MenuItem } from '@/components/ui/menu';
import { Box } from '@/components/ui/box';
import { Stack } from '@/components/ui/stack';
import { Typography } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { RfqProductsTable } from "./rfqTables";
import { paths } from "@/config/paths";
import { Plus as PlusIcon } from '@phosphor-icons/react';
import Link from 'next/link';
import { TablePagination } from "@/components/ui/pagination";
import { useDispatch, useSelector } from "react-redux";
import { useGetAllRfqByBuyerIdQuery } from "@/redux/features/buyer-rfq/rfq-api";
import { useAppSelector } from "@/redux";
import { useAuthIdentity } from "@/hooks/use-auth-identity";
import { useRouter } from "next/navigation";

import { motion } from 'framer-motion';
import { BsBoxSeam, BsCheckCircle, BsClockHistory, BsTags } from 'react-icons/bs';

export const mockData = [
  {
    rfqId: 1,
    rfqDescription: "Looking for a product to be shipped to Nigeria",
    Location: 'Nigeria',
    Destination: 'China',
    shippingTerms: ['CPT'],
    PaymentTerms: ['T/T'],
    name: "Tourmaline",
    subCategory: 'Tourmaline',
    quantityMeasure: 'kg',
    category: "Minerals",
    deliveryPeriod: '3 month',
    durationOfSupply: '2 weeks',
    paymentTermsDescribed: 'This goods will be paid upon recieveal of samples at 50% upfront',
    locationCode: 'US',
    state: 'Delaware',
    stateCode: 'dw',
    shippingTermsDescribed: 'The is needed to be shipped for a duration of 3 weeks interval',
    streetNo: 'no 12 delaware',
    zipCode: 123456,
    quantity: "200",
    dateCreated: "23-10-2024",
    expirationDate: "20-11-2024",
    status: ["Confirmed"],
    image: ["https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",],
  },
  {
    rfqId: 2,
    rfqDescription: "Looking for a product to be shipped to Nigeria",
    Location: 'Nigeria',
    Destination: 'China',
    shippingTerms: ['CPT'],
    PaymentTerms: ['T/T'],
    name: "Feldspar",
    subCategory: 'Tourmaline',
    quantityMeasure: 'kg',
    category: "Nineralstals",
    deliveryPeriod: '3 month',
    durationOfSupply: '2 weeks',
    paymentTermsDescribed: 'This goods will be paid upon recieveal of samples at 50% upfront',
    locationCode: 'US',
    state: 'Delaware',
    stateCode: 'dw',
    shippingTermsDescribed: 'The is needed to be shipped for a duration of 3 weeks interval',
    streetNo: 'no 12 delaware',
    zipCode: 123456,
    quantity: "300",
    dateCreated: "22-10-2024",
    expirationDate: "20-11-2024",
    status: ["Pending",],
    image: ["https://images.unsplash.com/photo-1667680468347-a2911303a6b4?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDF8fHxlbnwwfHx8fHw%3D",],
  },
];

const ListedRfQs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [filteredData, setFilteredData] = useState(mockData);
  const { user, appData, effectiveUserId } = useAuthIdentity();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const dispatch = useDispatch();
  const router = useRouter();

  const params = {
    buyerId: effectiveUserId,
    page: page + 1,
    limit: rowsPerPage,
    q: searchTerm,
    category: categoryFilter,
    sort: "createdAt",
  };
  const { data, isLoading, isError } = useGetAllRfqByBuyerIdQuery(params);

  // Handle page change
  const handlePageChange = (event: any, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (event: any) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle Search Input
  const handleSearch = (e: any) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  // Handle Category Filter
  const handleCategoryFilter = (e: any) => {
    setCategoryFilter(e.target.value);
    setPage(0);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setPage(0);
  };

  const rfqList = data?.data || [];
  const totalItems = data?.total_items || rfqList.length;
  const activeCount = rfqList.filter((r: any) => {
    const statusVal = r.status;
    if (Array.isArray(statusVal)) return statusVal.includes('Confirmed') || statusVal.includes('ACTIVE');
    return statusVal === 'Confirmed' || statusVal === 'ACTIVE' || !statusVal;
  }).length;

  const pendingCount = rfqList.filter((r: any) => {
    const statusVal = r.status;
    if (Array.isArray(statusVal)) return statusVal.includes('Pending');
    return statusVal === 'Pending';
  }).length;

  const categoriesCount = Array.from(new Set(rfqList.map((r: any) => r.rfqProductCategory || r.category).filter(Boolean))).length;

  return (
    <div className=" bg-gray-50 min-h-screen font-sans space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">My RFQs</h1>
          <p className="text-xs font-medium text-gray-500 mt-1">
            Manage your active Requests for Quotations, buyer specifications, and supplier offer boards
          </p>
        </div>
        <Link href={paths.dashboard.rfqs.create} passHref>
          <Button variant="contained" className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl px-5 py-2.5 text-xs transition-all shadow-none flex items-center gap-2">
            <PlusIcon size={16} />
            <span>Create RFQ</span>
          </Button>
        </Link>
      </div>

      {/* Stat Cards Grid (1:1 identical to AnalyticsCards design with matching icons) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          className="bg-green-50/60 rounded-xl border border-green-200/50 p-6 transition-all hover:border-green-400 hover:bg-green-50/80 group"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-700 group-hover:bg-green-200 transition-colors">
              <BsBoxSeam size={18} />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-medium text-gray-500">
              Total RFQs
            </h2>
            <div className="text-3xl font-bold text-gray-900 tracking-tight">
              {totalItems}
            </div>
            <p className="text-xs text-gray-400 font-medium">
              Posted RFQs in database
            </p>
          </div>
        </motion.div>

        <motion.div
          className="bg-green-50/60 rounded-xl border border-green-200/50 p-6 transition-all hover:border-green-400 hover:bg-green-50/80 group"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-700 group-hover:bg-green-200 transition-colors">
              <BsCheckCircle size={18} />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-medium text-gray-500">
              Active RFQs
            </h2>
            <div className="text-3xl font-bold text-gray-900 tracking-tight">
              {activeCount}
            </div>
            <p className="text-xs text-gray-400 font-medium">
              Open for supplier bidding
            </p>
          </div>
        </motion.div>

        <motion.div
          className="bg-green-50/60 rounded-xl border border-green-200/50 p-6 transition-all hover:border-green-400 hover:bg-green-50/80 group"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-700 group-hover:bg-green-200 transition-colors">
              <BsClockHistory size={18} />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-medium text-gray-500">
              Pending Review
            </h2>
            <div className="text-3xl font-bold text-gray-900 tracking-tight">
              {pendingCount}
            </div>
            <p className="text-xs text-gray-400 font-medium">
              Awaiting verification
            </p>
          </div>
        </motion.div>

        <motion.div
          className="bg-green-50/60 rounded-xl border border-green-200/50 p-6 transition-all hover:border-green-400 hover:bg-green-50/80 group"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-700 group-hover:bg-green-200 transition-colors">
              <BsTags size={18} />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-medium text-gray-500">
              Categories
            </h2>
            <div className="text-3xl font-bold text-gray-900 tracking-tight">
              {categoriesCount}
            </div>
            <p className="text-xs text-gray-400 font-medium">
              Distinct mineral categories
            </p>
          </div>
        </motion.div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto flex-1">
          <div className="relative w-full md:w-80">
            <TextField
              label="Search for RFQs"
              variant="outlined"
              placeholder="Search for your listed RFQs..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full text-xs font-medium rounded-xl"
            />
          </div>
          <div className="w-full md:w-60">
            <Select
              value={categoryFilter}
              onChange={handleCategoryFilter}
              size="sm"
              className="w-full text-xs font-medium rounded-xl"
            >
              <MenuItem value="">Filter by Category</MenuItem>
              <MenuItem value="Metals">Metals</MenuItem>
              <MenuItem value="Non-metals">Non-metals</MenuItem>
              <MenuItem value="Metallic Minerals">Metallic Minerals</MenuItem>
              <MenuItem value="Non-Metallic Minerals">Non-Metallic Minerals</MenuItem>
              <MenuItem value="Energy Minerals">Energy Minerals</MenuItem>
            </Select>
          </div>

          {(searchTerm || categoryFilter) && (
            <Button
              onClick={clearFilters}
              variant="outlined"
              className="text-xs font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-xl px-4 py-2"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* RFQ Table Container */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <RfqProductsTable isLoading={isLoading} isError={isError} rows={rfqList} />
        <div className="p-4 border-t border-gray-100 bg-white">
          <TablePagination
            count={totalItems}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            page={page}
            rowsPerPage={rowsPerPage}
          />
        </div>
      </div>
    </div>
  );
};

export default ListedRfQs;
