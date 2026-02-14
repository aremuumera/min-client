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
import { useRouter } from "next/navigation";

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
  {
    rfqId: 3,
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
    rfqId: 3,
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
  {
    rfqId: 4,
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
    rfqId: 5,
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
  {
    rfqId: 6,
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
    rfqId: 7,
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
  // Add more items here...
];

const ListedRfQs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [filteredData, setFilteredData] = useState(mockData);
  const { user, appData } = useAppSelector((state) => state.auth);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const dispatch = useDispatch();
  const router = useRouter();

  const params = {
    buyerId: user?.id,
    page: page + 1,
    limit: rowsPerPage,
    q: searchTerm,
    category: categoryFilter,
    sort: "createdAt",
  };


  const { data, isLoading, isError } = useGetAllRfqByBuyerIdQuery(params);


  // console.log("data", data);


  // Handle page change
  const handlePageChange = (event: any, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (event: any) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to first page when rows per page changes
  };

  // Handle Search Input
  const handleSearch = (e: any) => {
    setSearchTerm(e.target.value);
    setPage(0); // Reset to first page when search changes
  };

  // Handle Category Filter
  const handleCategoryFilter = (e: any) => {
    setCategoryFilter(e.target.value);
    setPage(0); // Reset to first page when filter changes
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <Stack direction={{ xs: 'column', sm: 'row' }} py='40px' spacing={3} sx={{ alignItems: 'flex-start' }}>
        <Box style={{ flex: '1 1 auto', }}>
          <Typography variant="h4">My RFQ's</Typography>
        </Box>
        <div>
          <Link href={paths.dashboard.rfqs.create} passHref>
            <Button
              startIcon={<PlusIcon />}
              variant="contained"
            >
              Create Rfq
            </Button>
          </Link>
        </div>
      </Stack>
      {/* Search and Filter */}
      <div className="flex flex-col gap-[20px] md:flex-row justify-between items-center my-8">
        <TextField
          label="Search for RFQs"
          variant="outlined"
          placeholder="Search for your listed rfqs"
          value={searchTerm}
          onChange={handleSearch}
          // borderRadius='40px'
          className="w-full md:w-[30%]  py-2 !rounded-[60px] "
        />
        <Select
          value={categoryFilter}
          onChange={handleCategoryFilter}
          // displayEmpty
          size="sm"
          className="mt-2 md:mt-0 md:ml-4  w-full md:w-[20%]"
        >
          <MenuItem value="">Filter by Category</MenuItem>
          <MenuItem value="Metals">Metals</MenuItem>
          <MenuItem value="Non-metals">Non-metals</MenuItem>
        </Select>
      </div>


      <Box className='bg-white  rounded-[30px] '>
        <RfqProductsTable isLoading={isLoading} isError={isError} rows={data?.data} />
        <Box className='py-[15px]  pr-[20px]'>
          <TablePagination
            count={data?.total_items || 0}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            page={page}
            rowsPerPage={rowsPerPage}
          />
        </Box>
      </Box>
    </div>
  );
};

export default ListedRfQs;
