'use client'

import React, { useState } from "react";
import { TextField } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { MenuItem } from '@/components/ui/menu';
import { Box } from '@/components/ui/box';
import { Stack } from '@/components/ui/stack';
import { Typography } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { paths } from "@/config/paths";
import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { TablePagination } from "@/components/ui/pagination";
import { SupplierProductsTable } from "./productsTable";
import { useGetAllProductBySupplierIdQuery } from "@/redux/features/supplier-products/products_api";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { useAuthIdentity } from "@/hooks/use-auth-identity";
import { useGetMainCategoryQuery } from "@/redux/features/categories/cat_api";
import Link from "next/link";
import { BsBoxSeam, BsCheckCircle, BsClockHistory, BsTags } from 'react-icons/bs';
import { motion } from 'framer-motion';

const mockData = [

  {
    supplierProductId: 1,
    productName: "Tourmaline",
    productCategory: "Metals",
    productType: 'metals',
    deliveryPeriod: '10 days',
    quantity: '30',
    productSubCategory: 'Mineral processor',
    quantityMeasure: 'tons',
    productHeaderDescription: 'lorem Ipsum d Prometheus Lorem Ipsum et  dolor Lorem Ipsum et dolor Lorem Ipsum et dolor   Lorem Ipsum et dolor Lorem  Ipsum et dolor Lorem',
    realPrice: '1000',
    prevPrice: '5000',
    location: 'Nigeria',
    state: 'Lagos',
    zipCode: '123',
    streetNo: 'delaware street New york ',
    composition: 'NA2Al3',
    hardness: '10',
    density: '10',
    color: 'red',
    dateCreated: "23-10-2024",
    expirationDate: "20-11-2024",
    Location: 'Uk',
    Destination: 'China',
    shippingTermsDescribed: 'The shipping Terms for this is product is for a 50% upfront subscription',
    paymentTermsDescribed: 'The payment for this goods is a 50% upfront transaction',
    shippingTerms: ['CPT'],
    PaymentTerms: ['T/T'],
    longitude: '23.23456',
    latitude: '4356.23',
    status: "Confirmed",
    ProductDetailDescription: [
      {
        header: "About Us",
        description: "Looking for a product to be shipped to Nigeria"
      },
      {
        header: "About Our Mineral Researchessss",
        description: "hh"
      }
    ],
    productAttachment: [
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
    productImage: [
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
  },
  {
    supplierProductId: 2,
    productName: "Feldspar",
    productCategory: "Non-metals",
    productType: 'metals',
    deliveryPeriod: '10 days',
    quantity: '30',
    productSubCategory: 'Mineral processor',
    quantityMeasure: 'tons',
    productHeaderDescription: 'lorem Ipsum d Prometheus Lorem Ipsum et  dolor Lorem Ipsum et dolor Lorem Ipsum et dolor   Lorem Ipsum et dolor Lorem  Ipsum et dolor Lorem',
    realPrice: '1000',
    prevPrice: '5000',
    location: 'Nigeria',
    state: 'Lagos',
    zipCode: '123',
    streetNo: 'delaware street New york ',
    composition: 'NA2Al3',
    hardness: '10',
    density: '10',
    color: 'red',
    dateCreated: "22-10-2024",
    expirationDate: "20-11-2024",
    Location: 'Uk',
    Destination: 'China',
    shippingTermsDescribed: 'The shipping Terms for this is product is for a 50% upfront subscription',
    paymentTermsDescribed: 'The payment for this goods is a 50% upfront transaction',
    shippingTerms: ['CPT'],
    PaymentTerms: ['T/T'],
    longitude: '23.23456',
    latitude: '4356.23',
    status: "Pending",
    ProductDetailDescription: [
      {
        header: "About Us",
        description: "Looking for a product to be shipped to Nigeria"
      },
      {
        header: "About Our Mineral Researchessss",
        description: "hh"
      }
    ],
    productAttachment: [
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
    productImage: ["https://images.unsplash.com/photo-1667680468347-a2911303a6b4?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDF8fHxlbnwwfHx8fHw%3D", "https://images.unsplash.com/photo-1667680468347-a2911303a6b4?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDF8fHxlbnwwfHx8fHw%3D", "https://images.unsplash.com/photo-1667680468347-a2911303a6b4?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDF8fHxlbnwwfHx8fHw%3D"],
  },
  {
    supplierProductId: 3,
    productName: "Tourmaline",
    productCategory: "Metals",
    productType: 'metals',
    deliveryPeriod: '10 days',
    quantity: '30',
    productSubCategory: 'Mineral processor',
    quantityMeasure: 'tons',
    productHeaderDescription: 'lorem Ipsum d Prometheus Lorem Ipsum et  dolor Lorem Ipsum et dolor Lorem Ipsum et dolor   Lorem Ipsum et dolor Lorem  Ipsum et dolor Lorem',
    realPrice: '1000',
    prevPrice: '5000',
    location: 'Nigeria',
    state: 'Lagos',
    zipCode: '123',
    streetNo: 'delaware street New york ',
    composition: 'NA2Al3',
    hardness: '10',
    density: '10',
    color: 'red',
    dateCreated: "23-10-2024",
    expirationDate: "20-11-2024",
    Location: 'Uk',
    Destination: 'China',
    shippingTermsDescribed: 'The shipping Terms for this is product is for a 50% upfront subscription',
    paymentTermsDescribed: 'The payment for this goods is a 50% upfront transaction',
    shippingTerms: ['CPT'],
    PaymentTerms: ['T/T'],
    longitude: '23.23456',
    latitude: '4356.23',
    status: "Confirmed",
    ProductDetailDescription: [
      {
        header: "About Us",
        description: "Looking for a product to be shipped to Nigeria"
      },
      {
        header: "About Our Mineral Researchessss",
        description: "hh"
      }
    ],
    productAttachment: [
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
    productImage: ["https://images.unsplash.com/photo-1667680468347-a2911303a6b4?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDF8fHxlbnwwfHx8fHw%3D", "https://images.unsplash.com/photo-1667680468347-a2911303a6b4?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDF8fHxlbnwwfHx8fHw%3D", "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"]
    // ,
  },
  {
    supplierProductId: 3,
    productName: "Feldspar",
    productCategory: "Non-metals",
    productType: 'metals',
    deliveryPeriod: '10 days',
    quantity: '30',
    productSubCategory: 'Mineral processor',
    quantityMeasure: 'tons',
    productHeaderDescription: 'lorem Ipsum d Prometheus Lorem Ipsum et  dolor Lorem Ipsum et dolor Lorem Ipsum et dolor   Lorem Ipsum et dolor Lorem  Ipsum et dolor Lorem',
    realPrice: '1000',
    prevPrice: '5000',
    location: 'Nigeria',
    state: 'Lagos',
    zipCode: '123',
    streetNo: 'delaware street New york ',
    composition: 'NA2Al3',
    hardness: '10',
    density: '10',
    color: 'red',
    dateCreated: "22-10-2024",
    expirationDate: "20-11-2024",
    Location: 'Uk',
    Destination: 'China',
    shippingTermsDescribed: 'The shipping Terms for this is product is for a 50% upfront subscription',
    paymentTermsDescribed: 'The payment for this goods is a 50% upfront transaction',
    shippingTerms: ['CPT'],
    PaymentTerms: ['T/T'],
    longitude: '23.23456',
    latitude: '4356.23',
    status: "Pending",
    ProductDetailDescription: [
      {
        header: "About Us",
        description: "Looking for a product to be shipped to Nigeria"
      },
      {
        header: "About Our Mineral Researchessss",
        description: "hh"
      }
    ],
    productAttachment: [
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
    productImage: ["https://images.unsplash.com/photo-1667680468347-a2911303a6b4?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDF8fHxlbnwwfHx8fHw%3D", "https://images.unsplash.com/photo-1667680468347-a2911303a6b4?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDF8fHxlbnwwfHx8fHw%3D", "https://images.unsplash.com/photo-1667680468347-a2911303a6b4?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDF8fHxlbnwwfHx8fHw%3D"],
  },
  {
    supplierProductId: 4,
    productName: "Tourmaline",
    productCategory: "Metals",
    productType: 'metals',
    deliveryPeriod: '10 days',
    quantity: '30',
    productSubCategory: 'Mineral processor',
    quantityMeasure: 'tons',
    productHeaderDescription: 'lorem Ipsum d Prometheus Lorem Ipsum et  dolor Lorem Ipsum et dolor Lorem Ipsum et dolor   Lorem Ipsum et dolor Lorem  Ipsum et dolor Lorem',
    realPrice: '1000',
    prevPrice: '5000',
    location: 'Nigeria',
    state: 'Lagos',
    zipCode: '123',
    streetNo: 'delaware street New york ',
    composition: 'NA2Al3',
    hardness: '10',
    density: '10',
    color: 'red',
    dateCreated: "23-10-2024",
    expirationDate: "20-11-2024",
    Location: 'Uk',
    Destination: 'China',
    shippingTermsDescribed: 'The shipping Terms for this is product is for a 50% upfront subscription',
    paymentTermsDescribed: 'The payment for this goods is a 50% upfront transaction',
    shippingTerms: ['CPT'],
    PaymentTerms: ['T/T'],
    longitude: '23.23456',
    latitude: '4356.23',
    status: "Confirmed",
    ProductDetailDescription: [
      {
        header: "About Us",
        description: "Looking for a product to be shipped to Nigeria"
      },
      {
        header: "About Our Mineral Researchessss",
        description: "hh"
      }
    ],
    productAttachment: [
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
    productImage: ["https://images.unsplash.com/photo-1667680468347-a2911303a6b4?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDF8fHxlbnwwfHx8fHw%3D", "https://images.unsplash.com/photo-1667680468347-a2911303a6b4?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDF8fHxlbnwwfHx8fHw%3D", "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",

    ],
  },
  {
    supplierProductId: 5,
    productName: "Feldspar",
    productCategory: "Non-metals",
    productType: 'metals',
    deliveryPeriod: '10 days',
    quantity: '30',
    productSubCategory: 'Mineral processor',
    quantityMeasure: 'tons',
    productHeaderDescription: 'lorem Ipsum d Prometheus Lorem Ipsum et  dolor Lorem Ipsum et dolor Lorem Ipsum et dolor   Lorem Ipsum et dolor Lorem  Ipsum et dolor Lorem',
    realPrice: '1000',
    prevPrice: '5000',
    location: 'Nigeria',
    state: 'Lagos',
    zipCode: '123',
    streetNo: 'delaware street New york ',
    composition: 'NA2Al3',
    hardness: '10',
    density: '10',
    color: 'red',
    dateCreated: "22-10-2024",
    expirationDate: "20-11-2024",
    Location: 'Uk',
    Destination: 'China',
    shippingTermsDescribed: 'The shipping Terms for this is product is for a 50% upfront subscription',
    paymentTermsDescribed: 'The payment for this goods is a 50% upfront transaction',
    shippingTerms: ['CPT'],
    PaymentTerms: ['T/T'],
    longitude: '23.23456',
    latitude: '4356.23',
    status: "Pending",
    ProductDetailDescription: [
      {
        header: "About Us",
        description: "Looking for a product to be shipped to Nigeria"
      },
      {
        header: "About Our Mineral Researchessss",
        description: "hh"
      }
    ],
    productAttachment: [
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
    productImage: ["https://images.unsplash.com/photo-1667680468347-a2911303a6b4?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDF8fHxlbnwwfHx8fHw%3D", "https://images.unsplash.com/photo-1667680468347-a2911303a6b4?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDF8fHxlbnwwfHx8fHw%3D", "https://images.unsplash.com/photo-1667680468347-a2911303a6b4?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDF8fHxlbnwwfHx8fHw%3D",],
  },
  {
    supplierProductId: 6,
    productName: "Tourmaline",
    productCategory: "Metals",
    productType: 'metals',
    deliveryPeriod: '10 days',
    quantity: '30',
    productSubCategory: 'Mineral processor',
    quantityMeasure: 'tons',
    productHeaderDescription: 'lorem Ipsum d Prometheus Lorem Ipsum et  dolor Lorem Ipsum et dolor Lorem Ipsum et dolor   Lorem Ipsum et dolor Lorem  Ipsum et dolor Lorem',
    realPrice: '1000',
    prevPrice: '5000',
    location: 'Nigeria',
    state: 'Lagos',
    zipCode: '123',
    streetNo: 'delaware street New york ',
    composition: 'NA2Al3',
    hardness: '10',
    density: '10',
    color: 'red',
    dateCreated: "23-10-2024",
    expirationDate: "20-11-2024",
    Location: 'Uk',
    Destination: 'China',
    shippingTermsDescribed: 'The shipping Terms for this is product is for a 50% upfront subscription',
    paymentTermsDescribed: 'The payment for this goods is a 50% upfront transaction',
    shippingTerms: ['CPT'],
    PaymentTerms: ['T/T'],
    longitude: '23.23456',
    latitude: '4356.23',
    status: "Confirmed",
    ProductDetailDescription: [
      {
        header: "About Us",
        description: "Looking for a product to be shipped to Nigeria"
      },
      {
        header: "About Our Mineral Researchessss",
        description: "hh"
      }
    ],
    productAttachment: [
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
    productImage: ["https://images.unsplash.com/photo-1667680468347-a2911303a6b4?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDF8fHxlbnwwfHx8fHw%3D", "https://images.unsplash.com/photo-1667680468347-a2911303a6b4?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDF8fHxlbnwwfHx8fHw%3D", "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",

    ],
  },
  {
    supplierProductId: 7,
    productName: "Feldspar",
    productCategory: "Non-metals",
    productType: 'metals',
    deliveryPeriod: '10 days',
    quantity: '30',
    productSubCategory: 'Mineral processor',
    quantityMeasure: 'tons',
    productHeaderDescription: 'lorem Ipsum d Prometheus Lorem Ipsum et  dolor Lorem Ipsum et dolor Lorem Ipsum et dolor   Lorem Ipsum et dolor Lorem  Ipsum et dolor Lorem',
    realPrice: '1000',
    prevPrice: '5000',
    location: 'Nigeria',
    state: 'Lagos',
    zipCode: '123',
    streetNo: 'delaware street New york ',
    composition: 'NA2Al3',
    hardness: '10',
    density: '10',
    color: 'red',
    dateCreated: "22-10-2024",
    expirationDate: "20-11-2024",
    Location: 'Uk',
    Destination: 'China',
    shippingTermsDescribed: 'The shipping Terms for this is product is for a 50% upfront subscription',
    paymentTermsDescribed: 'The payment for this goods is a 50% upfront transaction',
    shippingTerms: ['CPT'],
    PaymentTerms: ['T/T'],
    longitude: '23.23456',
    latitude: '4356.23',
    status: "Pending",
    ProductDetailDescription: [
      {
        header: "About Us",
        description: "Looking for a product to be shipped to Nigeria"
      },
      {
        header: "About Our Mineral Researchessss",
        description: "hh"
      }
    ],
    productAttachment: [
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
    productImage: ["https://images.unsplash.com/photo-1667680468347-a2911303a6b4?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDF8fHxlbnwwfHx8fHw%3D", "https://images.unsplash.com/photo-1667680468347-a2911303a6b4?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDF8fHxlbnwwfHx8fHw%3D", "https://images.unsplash.com/photo-1667680468347-a2911303a6b4?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDF8fHxlbnwwfHx8fHw%3D",],
  },
  // Add more items here...
];

const ListedProducts = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const { user, effectiveUserId } = useAuthIdentity();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const dispatch = useAppDispatch();

  const { data: mainCategories } = useGetMainCategoryQuery();

  const params = {
    supplierId: effectiveUserId,
    page: page + 1,
    limit: rowsPerPage,
    q: searchTerm,
    search: searchTerm,
    category: categoryFilter,
    sort: "createdAt",
  };

  const { data, isLoading, isError } = useGetAllProductBySupplierIdQuery(params);

  // Handle page change
  const handlePageChange = (event: any, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle Search Input
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  // Handle Category Filter
  const handleCategoryFilter = (e: { target: { value: string } }) => {
    setCategoryFilter(e.target.value);
    setPage(0);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setPage(0);
  };

  const productsList = data?.products || [];
  const totalItems = data?.total_items || productsList.length;
  const activeCount = productsList.filter((p: any) => p.status === 'Confirmed' || !p.status || p.status === 'ACTIVE').length;
  const pendingCount = productsList.filter((p: any) => p.status === 'Pending').length;
  const categoriesCount = Array.from(new Set(productsList.map((p: any) => p.product_category).filter(Boolean))).length;

  return (
    <div className=" bg-gray-50 min-h-screen font-sans space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">My Products</h1>
          <p className="text-xs font-medium text-gray-500 mt-1">
            Manage your listed mineral catalog, inventory status, and storefront specifications
          </p>
        </div>
        <Link href={paths.dashboard.products.create} passHref>
          <Button variant="contained" className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl px-5 py-2.5 text-xs transition-all shadow-none flex items-center gap-2">
            <PlusIcon size={16} />
            <span>Create Product</span>
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
              Total Products
            </h2>
            <div className="text-3xl font-bold text-gray-900 tracking-tight">
              {totalItems}
            </div>
            <p className="text-xs text-gray-400 font-medium">
              Active products in your catalog
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
              Active Listings
            </h2>
            <div className="text-3xl font-bold text-gray-900 tracking-tight">
              {activeCount}
            </div>
            <p className="text-xs text-gray-400 font-medium">
              Confirmed & active catalog
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
              {categoriesCount || (Array.isArray(mainCategories) ? mainCategories.length : 0)}
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
              label="Search Products"
              variant="outlined"
              value={searchTerm}
              placeholder="Search for your listed products..."
              onChange={handleSearch}
              className="w-full text-xs font-medium rounded-xl"
            />
          </div>

          <div className="w-full md:w-60">
            <Select
              value={categoryFilter}
              onChange={handleCategoryFilter}
              size="sm"
              label="Category"
              className="w-full text-xs font-medium rounded-xl"
            >
              <MenuItem value="">All Categories</MenuItem>
              {Array.isArray(mainCategories) && mainCategories.map((cat: any) => (
                <MenuItem key={cat.id || cat.name} value={cat.name}>
                  {cat.name}
                </MenuItem>
              ))}
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

      {/* Products Table Container */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <SupplierProductsTable
          isLoading={isLoading}
          isError={isError}
          rows={productsList}
          emptyMessage="No products found"
          errorMessage="Failed to load products"
        />
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

export default ListedProducts;
