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
import Link from "next/link";

export const mockData = [

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
  const { user, isTeamMember, ownerUserId } = useAppSelector((state) => state.auth);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const dispatch = useAppDispatch();

  const params = {
    supplierId: isTeamMember ? ownerUserId : user?.id,
    page: page + 1,
    limit: rowsPerPage,
    q: searchTerm,
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
    setPage(0); // Reset to first page when rows per page changes
  };

  // Handle Search Input
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(0); // Reset to first page when search changes
  };

  // Handle Category Filter
  const handleCategoryFilter = (e: { target: { value: string } }) => {
    setCategoryFilter(e.target.value);
    setPage(0); // Reset to first page when filter changes
  };



  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <Stack direction={{ xs: 'column', sm: 'row' }} py='40px' spacing={3} sx={{ alignItems: 'flex-start' }}>
        <Box sx={{ flex: '1 1 auto', }}>
          <Typography variant="h4">My Product's</Typography>
        </Box>
        <div>
          <Link href={paths.dashboard.products.create} passHref>
            <Button
              startIcon={<PlusIcon />}
              variant="contained"
            >
              Create Product
            </Button>
          </Link>
        </div>
      </Stack>
      {/* Search and Filter */}
      <div className="flex flex-col gap-[20px] md:flex-row justify-between items-center my-8">
        <TextField
          label="Search for RFQs"
          variant="outlined"
          value={searchTerm}
          placeholder="Search for your listed products"
          onChange={handleSearch}
          // borderRadius='40px'
          //  sx={{py: 2}}
          className="w-full md:w-[30%] py-2 rounded-[60px]! "
        />
        <Select
          value={categoryFilter}
          onChange={handleCategoryFilter}
          // displayEmpty
          size="sm"
          label="Category"
          className="mt-2 md:mt-0 md:ml-4  w-full md:w-[20%]"
        >
          <MenuItem value="">Filter by Category</MenuItem>
          <MenuItem value="Metals">Metals</MenuItem>
          <MenuItem value="Non-metals">Non-metals</MenuItem>
        </Select>
      </div>



      <Box className='bg-white  rounded-[30px] '>
        <SupplierProductsTable
          isLoading={isLoading}
          isError={isError}
          rows={data?.products || []}
          emptyMessage="No products found"
          errorMessage="Failed to load products"
        />
        <Box className='py-[15px]  pr-[20px]'>
          <TablePagination
            count={data?.total_items || 0}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            page={page}
            rowsPerPage={rowsPerPage} />
        </Box>
      </Box>
    </div>
  );
};

export default ListedProducts;
