'use client'

import { Typography } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/input';
import { Stack } from '@/components/ui/stack';
import { Box } from '@/components/ui/box';
import React, { useEffect, useState } from 'react';
import CustomModal from '@/utils/CustomModal';
import { paths } from '@/config/paths';

import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
// import { CopyToClipboard } from 'react-copy-to-clipboard';
import { IoIosArrowBack } from 'react-icons/io';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { mockData } from '../ListedProducts';
import SupplierUpdateField from './SupplierUpdateField';
import { MoqUnits as Moq } from '@/lib/marketplace-data';
import { MdEdit, MdOutlineContentCopy, MdShare } from 'react-icons/md';
import { FaFacebook, FaTwitter, FaLinkedin, FaWhatsapp } from 'react-icons/fa';
import { paymentTerms, shippingTerms as shippingTermsFields } from '../CreateProducts/paymentTerms';
import { useSelector } from 'react-redux';
import { useGetAllProductDetailsForSupQuery, useGetAllProductDetailsQuery } from '@/redux/features/supplier-products/products_api';
import { formatDate } from '@/utils/helper';
import Loader from '@/lib/Loader';
import { useGetCategoryQuery, useGetMainCategoryQuery, useGetSubCategoryQuery } from '@/redux/features/categories/cat_api';

const EditSupProduct = ({ open, rows, onClose }: any) => {
  const [supProductsIdData, setSupProductsIdData] = useState<any>([]);
  const router = useRouter();
  const params = useParams();
  const listedSupplierProductId = params?.listedSupplierProductId as string;
  const [openModal, setOpenModal] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [fields, setFields] = useState<any[]>([]);
  const [mediaImages, setMediaImages] = useState([]);
  const [mediaAttachments, setMediaAttachments] = useState([]);

  const { user, appData, isTeamMember, ownerUserId } = useSelector((state: any) => state.auth);

  const { data, isLoading, isError } = useGetAllProductDetailsForSupQuery({
    supplierId: isTeamMember ? ownerUserId : user?.id,
    productId: listedSupplierProductId
  },
    {
      // refetchOnMountOrArgChange: true,
      // skip: !user?.id || !listedSupplierProductId,
    }
  );

  const theProd = data?.product

  // const [currentCategories, setCurrentCategories] = useState({
  //   main: theProd?.product_main_category || '',
  //   product: theProd?.product_category || '',
  //   sub: theProd?.product_sub_category || ''
  // });

  const [currentCategories, setCurrentCategories] = useState({
    main: '',
    product: '',
    sub: '',
    catTag: ''
  });

  // Add category API hooks
  const { data: mainCatData } = useGetMainCategoryQuery();

  const { data: productCatData } = useGetCategoryQuery(
    mainCatData?.find((c: any) => c.name === currentCategories.main)?.tag,
    { skip: !currentCategories.main }
  );

  const { data: subCatData } = useGetSubCategoryQuery(
    productCatData?.children?.find((c: any) => c.name === currentCategories.product)?.original_id,
    { skip: !currentCategories.product }
  );



  const exampleRoute = 'http://localhost:3000/products/details/2/High-Purity-Limestone-for-Industrial-Use'

  console.log("SUP DETAIL data", data?.product);

  useEffect(() => {
    if (data?.product) {
      setSupProductsIdData(data?.product);
      setMediaImages(data?.product?.images);
      setMediaAttachments(data?.product?.attachments);

      setCurrentCategories({
        main: data.product.product_main_category || '',
        product: data.product.product_category || '',
        sub: data.product.product_sub_category || '',
        catTag: data.product.category_tag || ''
      });
    }
  }, [data?.product, listedSupplierProductId, router]);

  // useEffect(() => {
  //   if (mockData && Array.isArray(mockData) && mockData.length > 0 && listedSupplierProductId !== undefined) {
  //     const data = mockData.find((mock) => mock.supplierProductId === Number(listedSupplierProductId));
  //     console.log('listedSupplierProductId', listedSupplierProductId, mockData);
  //     if (data) {
  //       setSupProductsIdData(data);
  //     } else {
  //       // Redirect if productId is not found in mockData
  //       navigate('/dashboard/supplier-list', { replace: true });
  //     }
  //   } else {
  //     // Redirect if mockData is empty or undefined
  //     navigate('/dashboard/supplier-list', { replace: true });
  //   }
  // }, [mockData, listedSupplierProductId, navigate]);



  const handleOpenModal = (field: string) => {
    setFields([(fieldConfigurations as any)[field]]);
    setOpenModal(true);
  };

  const handleSave = async (updatedData: any) => {

  };



  const subCategoryField = ['Metallic minerals', 'Non-metallic Industrial minerals', 'Marble and Natural Stone', 'Gravel, Sand or Aggregate', 'Coal', 'Gems', 'Others'];

  const categoryFields = ['Minerals', 'Mining Service Company',]

  const quantityMeasureField = Moq;

  const paymentTermsField = paymentTerms;

  const shippingTermsField = shippingTermsFields;



  // const { supplierProductId, productName, productCategory,
  //   productSubCategory, productType, deliveryPeriod,
  //   quantity, measure, productHeaderDescription, productAttachment,
  //   realPrice, prevPrice, location, state, zipCode,
  //   streetNo, composition, hardness, density,latitude, longitude,
  //   color, ProductDetailDescription, dateCreated,
  //   expirationDate, Destination, shippingTerms,
  //   PaymentTerms, status, productImage, paymentTermsDescribed, shippingTermsDescribed
  // } = supProductsIdData;

  const {
    id,
    supplierId,
    product_name,
    product_category,
    product_sub_category,
    product_main_category,
    productHeaderDescription,
    productDetailDescription,
    color,
    composition,
    delivery_period,
    density,
    hardness,
    measure,
    prev_price,
    real_price,
    quantity,
    full_address,
    latitude,
    longitude,
    selected_country_name,
    selected_state,
    streetNo,
    zip_code,
    selected_payments,
    selected_shipping,
    viewCount,
    createdAt,
    isVerified,
    paymentsTermsDescribed,
    shippingTermsDescribed,
    images,
    attachments
  } = supProductsIdData;

  // console.log("selected_payments", selected_payments);
  const fieldConfigurations = {
    productCategories: {
      id: 'productCategories',
      type: 'categoryGroup',
      label: 'Product Categories',
      value: currentCategories,
      mainCatData: mainCatData || [],
      productCatData: productCatData || { children: [] },
      subCatData: subCatData || { children: [] }
    },

    supplierProductId: {
      id: 'supplierProductId',
      type: 'text',
      label: 'Product ID',
      value: supplierId,
    },
    productName: {
      id: 'productName',
      type: 'text',
      label: 'Product Name',
      value: product_name,
    },
    ProductDetailDescription: {
      id: 'ProductDetailDescription',
      type: 'headerDescription',
      label: 'Product Detail Description',
      value: productDetailDescription,
    },
    // productCategory: {
    //   id: 'productCategory',
    //   type: 'select',
    //   label: 'Product Category',
    //   multipleFields: false,
    //   value: product_category,
    //   options: categoryFields,
    // },
    // productMainCategory: {
    //   id: 'productMainCategory',
    //   type: 'select',
    //   label: 'Product Main Category',
    //   multipleFields: false,
    //   value: product_main_category,
    //   options: categoryFields,
    // },
    // productSubCategory: {
    //   id: 'productSubCategory',
    //   type: 'select',
    //   label: 'Product sub-category',
    //   value: product_sub_category,
    //   multipleFields: false,
    //   selectCategoryName: 'rfqSubCategory',
    //   options: subCategoryField
    // },
    // productType: {
    //   id: 'productType',
    //   type: 'select',
    //   label: 'Product Type',
    //   multipleFields: false,
    //   value: productType,
    //   options: ['Metals', 'Non-metals', 'Others'],
    // },
    deliveryPeriod: {
      id: 'deliveryPeriod',
      type: 'text',
      label: 'Delivery Period',
      value: delivery_period,
    },
    quantity: {
      id: 'quantity',
      type: 'text',
      label: 'Minimum Order Quantity',
      value: quantity,
    },
    measure: {
      id: 'measure',
      type: 'select',
      label: 'Quantity Measure Type',
      value: measure,
      options: quantityMeasureField
    },
    productHeaderDescription: {
      id: 'productHeaderDescription',
      type: 'textarea',
      label: 'Product Header Description',
      value: productHeaderDescription,
    },
    realPrice: {
      id: 'realPrice',
      type: 'text',
      label: 'Real Price',
      value: real_price,
    },
    prevPrice: {
      id: 'prevPrice',
      type: 'text',
      label: 'Previous Price',
      value: prev_price,
    },
    location: {
      id: 'location',
      type: 'select',
      label: 'Country',
      value: selected_country_name,
      multipleFields: false,
      selectCategoryName: 'location',
      options: [],
    },
    state: {
      id: 'state',
      type: 'select',
      label: 'State',
      value: selected_state,
      multipleFields: false,
      selectCategoryName: 'state',
      options: [],
    },
    zipCode: {
      id: 'zipCode',
      type: 'text',
      label: 'Zip Code',
      value: zip_code,
    },
    streetNo: {
      id: 'streetNo',
      type: 'text',
      label: 'Street Number',
      value: streetNo,
    },
    fullAdress: {
      id: 'fullAdress',
      type: 'text',
      label: 'Full Address',
      value: full_address,
    },
    composition: {
      id: 'composition',
      type: 'text',
      label: 'Composition',
      value: composition,
    },
    hardness: {
      id: 'hardness',
      type: 'text',
      label: 'Hardness',
      value: hardness,
    },
    density: {
      id: 'density',
      type: 'text',
      label: 'Density',
      value: density,
    },
    color: {
      id: 'color',
      type: 'text',
      label: 'Color',
      value: color,
    },
    dateCreated: {
      id: 'dateCreated',
      type: 'text',
      label: 'Date Created',
      value: createdAt,
    },
    productImage: {
      id: 'productImage',
      type: 'file',
      label: 'Product Image',
      value: images,
    },
    productAttachment: {
      id: 'productAttachment',
      type: 'file',
      label: 'Product Attachment',
      value: attachments,
    },
    // expirationDate: {
    //   id: 'expirationDate',
    //   type: 'text',
    //   label: 'Expiration Date',
    //   value: expirationDate,
    // },
    shippingTerms: {
      id: 'shippingTerms',
      type: 'select',
      label: 'Shipping Terms',
      value: selected_shipping,
      multipleFields: true,
      selectCategoryName: 'shippingTerms',
      options: shippingTermsField,
    },
    PaymentTerms: {
      id: 'PaymentTerms',
      type: 'select',
      label: 'Payment Terms',
      value: selected_payments,
      multipleFields: true,
      selectCategoryName: 'PaymentTerms',
      options: paymentTermsField,
    },
    paymentTermsDescribed: {
      id: 'paymentTermsDescribed',
      type: 'text',
      label: 'Payment Terms Described',
      value: paymentsTermsDescribed,
    },
    shippingTermsDescribed: {
      id: 'shippingTermsDescribed',
      type: 'text',
      label: 'Shipping Terms Described',
      value: shippingTermsDescribed,
    },
    // Destination: {
    //   id: 'destination',
    //   type: 'text',
    //   label: 'Destination',
    //   value: Destination,
    // },
    // status: {
    //   id: 'status',
    //   type: 'select',
    //   label: 'status',
    //   value: status,
    //   options: ['On Supply', 'On-Purchase', 'Others'],
    // },
    longitude: {
      id: 'longitude',
      type: 'text',
      label: 'Longitude',
      value: longitude,
    },
    latitude: {
      id: 'latitude',
      type: 'text',
      label: 'Latitude',
      value: latitude,
    },

  };




  const ProductImagesArray = Array.isArray(supProductsIdData?.images)
    ? supProductsIdData.images
    : [supProductsIdData?.images];

  const ProductAttachmentArray = Array.isArray(supProductsIdData?.attachments)
    ? supProductsIdData.attachments
    : [supProductsIdData?.attachments];

  const dynamicFields = [
    // { label: 'Product Category', value: product_category, key: 'productCategory' },
    // { label: 'Product sub-category', value: product_sub_category, key: 'productSubCategory' },
    // { label: 'Product main-category', value: product_sub_category, key: 'productMainCategory' },
    {
      label: 'Categories',
      value: `${currentCategories.main}${currentCategories.product ? ` > ${currentCategories.product}` : ''}${currentCategories.sub ? ` > ${currentCategories.sub}` : ''}`,
      key: 'productCategories'
    },
    { label: 'Product Name', value: product_name, key: 'productName' },
    { label: 'Product Detailed Description', value: 'ProductDetailDescription', key: 'ProductDetailDescription' },
    // { label: 'Product Type', value: productType, key: 'productType' },
    { label: 'M.O.Q', value: quantity, key: 'quantity' },
    { label: 'Delivery Period', value: delivery_period, key: 'deliveryPeriod' },
    { label: 'Quantity Measure Type', value: measure, key: 'measure' },
    { label: 'Product Header Description', value: productHeaderDescription, key: 'productHeaderDescription', fullWidth: true },
    { label: 'Real Price', value: real_price, key: 'realPrice' },
    { label: 'Prev Price', value: prev_price, key: 'prevPrice' },
    { label: 'ZipCode', value: zip_code, key: 'zipCode' },
    { label: 'Street No', value: streetNo, key: 'streetNo' },
    { label: 'Full Address', value: full_address, key: 'fullAdress' },
    { label: 'Composition', value: composition, key: 'composition' },
    { label: 'Hardness', value: hardness, key: 'hardness' },
    { label: 'Density', value: density, key: 'density' },
    { label: 'Color', value: color, key: 'color' },
    { label: 'Country', value: selected_country_name, key: 'location' },
    { label: 'State', value: selected_state, key: 'state' },
    // { label: 'Expiration Date', value: expirationDate, key: 'expirationDate' },
    { label: 'Shipping Terms', value: selected_shipping?.join(', '), key: 'shippingTerms' },
    { label: 'Payment Terms', value: selected_payments?.join(', '), key: 'PaymentTerms' },
    // { label: 'Destination', value: Destination, key: 'Destination' },
    // { label: 'Status', value: status, key: 'status' },
    { label: 'Latitude', value: latitude, key: 'latitude' },
    { label: 'Longitude', value: longitude, key: 'longitude' },
    { label: 'Payment Terms Described', value: paymentsTermsDescribed, key: 'paymentTermsDescribed' },
    { label: 'Shipping Terms Described', value: shippingTermsDescribed, key: 'shippingTermsDescribed' },

  ];

  if (isLoading) return <div><Loader />.</div>;
  if (isError) return <div>Error loading profile</div>;
  if (!data) return <div>No profile data found</div>;
  if (!supProductsIdData) return <div>No product data found</div>;

  return (
    <div>
      <div className="w-full  ">
        <div className="flex px-[12px] py-[30px]  justify-between items-center">

          <div>
            <Link href={paths.dashboard.products.list} className="flex justify-center items-center gap-[6px]" >
              <IoIosArrowBack /> Back
            </Link>
          </div>

          <div>
            <Link href={paths.dashboard.products.create}>
              <Button className="flex items-center gap-2" variant="contained">
                <PlusIcon /> Create Product
              </Button>
            </Link>
          </div>
        </div>

        <div className="p-4 space-y-4 bg-white shadow rounded-lg">
          <div className='flex justify-between items-center py-[6px]'>
            <div>
              <h2 className='text-[2rem]  font-bold'>{product_name}</h2>
              <p className='pt-[5px] text-[#a8a8a8]'>Posted on {formatDate(createdAt)}</p>
            </div>
          </div>

          {/* <div className="flex overflow-x-auto space-x-2">
            {images?.map((img, i) => (
              <div key={i} className="w-40 h-32 o rounded flex-shrink-0"> 
                  <img src={img} alt="" className='' />
              </div>
            ))}
          </div> */}

          {/* Image Section */}
          <h3 className="font-semibold !text-left">{'Product Images'}</h3>
          <div className="relative flex items-start space-x-2">
            <div className="flex relative overflow-x-auto space-x-2">
              {images?.length > 0 && images?.map((img: any, i: number) => (
                <div key={i} className="w-40 h-32 o rounded flex-shrink-0">
                  <img src={img.url}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    className='' />
                </div>
              ))}
              <div >
              </div>
            </div>
            <Button
              className="absolute right-0 z-10 rounded-none shadow-md"
              style={{
                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
              }}
              onClick={() => handleOpenModal('productImage')}
              size="sm"
            >
              <MdEdit className="mr-2" />
              Edit Product Images
            </Button>
          </div>

          {/* Attachment Images */}
          <h3 className="font-semibold !text-left">{'Attachment'}</h3>
          <div className="relative flex items-start space-x-2">
            <div className="flex relative overflow-x-auto space-x-2">
              {attachments?.length > 0 && attachments?.map((img: any, i: number) => (
                <div key={i} className="w-40 h-32 o rounded flex-shrink-0">
                  {img.url.endsWith('.pdf') ? (
                    <div
                      onClick={() => {
                        const pdfUrl = img.url.replace('/image/upload/', '/raw/upload/');
                        window.open(img.url, '_blank', 'noopener,noreferrer');
                      }}
                      className="cursor-pointer flex flex-col justify-center items-center h-full w-full bg-[#f5f2f2] text-center"
                    >
                      <svg
                        width="40"
                        height="40"
                        viewBox="0 0 24 21"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                          stroke="#FF0000"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M14 2V8H20"
                          stroke="#FF0000"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M16 13H8"
                          stroke="#FF0000"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M16 17H8"
                          stroke="#FF0000"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M10 9H9H8"
                          stroke="#FF0000"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="block text-[#FF0000] text-xs mt-1">
                        PDF File
                      </span>
                    </div>
                  ) : (
                    <img
                      src={img.url}
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  )}
                </div>
              ))}
              <div >
              </div>
            </div>
            <Button
              className="absolute right-0 z-10 rounded-none shadow-md"
              style={{
                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
              }}
              onClick={() => handleOpenModal('productAttachment')}
              size="sm"
            >
              <MdEdit className="mr-2" />
              Edit Attachment
            </Button>
          </div>

          <div className="overflow-y-auto max-h-full space-y-4">
            {/* {dynamicFields.map((field) => ( */}
            {/* <div
                // key={field.key}
                className={`flex justify-between items-center ${ 'gap-[10px]' }`}
              >
                <div className={`flex flex-col justify-start ${ 'w-full max-w-[800px]' }`}>
                  <h3 className="font-semibold !text-left">{' All Categories'}</h3>
                  <p className="text-sm max-w-[200px] truncate text-gray-600">{ 'Edit all categies'}</p>
                </div>
                <Button
                  onClick={() => handleOpenModal('field.key')}
                  size="small"
                  startIcon={<EditIcon />}
                >
                  Edit
                </Button>
              </div> */}
            {/* ))} */}
          </div>

          <div className="overflow-y-auto max-h-full mb-6 space-y-4">
            {dynamicFields.map((field) => (
              <div
                key={field.key}
                className={`flex justify-between items-center ${field.fullWidth ? 'gap-[10px]' : ''}`}
              >
                <div className={`flex flex-col justify-start ${field.fullWidth ? 'w-full max-w-[800px]' : ''}`}>
                  <h3 className="font-semibold text-left!">{field.label}</h3>
                  <p className="text-sm max-w-[200px] truncate text-gray-600">{field.value}</p>
                </div>
                <Button
                  onClick={() => handleOpenModal(field.key)}
                  size="sm"
                  variant="outlined"
                >
                  <MdEdit className="mr-2" />
                  Edit
                </Button>
              </div>
            ))}
          </div>

          {/* Copy & Share Section */}
          {/* <div className="flex md:flex-row flex-col gap-[20px] justify-end items-center bg-gray-100 p-2 rounded">
            <div className='py-[25px] w-full max-w-[300px] border-[2px] border-primary bg-white rounded-[15px] flex items-center justify-between px-4'>
              <span className="truncate">SYYH89rhfbdu...</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText("SYYH89rhfbdu...");
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="p-1"
                title={copied ? 'Copied!' : 'Copy'}
              >
                <MdOutlineContentCopy />
              </button>
            </div>

            <div className="relative group">
              <Button variant='contained' className='w-full max-w-[300px] flex items-center gap-2 text-white'>
                <MdShare className='text-[1rem] text-white' /> Share
              </Button>
              <div className="absolute bottom-full mb-2 hidden group-hover:flex bg-white shadow-lg p-2 rounded gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-full"><FaFacebook /></button>
                <button className="p-2 hover:bg-gray-100 rounded-full"><FaTwitter /></button>
                <button className="p-2 hover:bg-gray-100 rounded-full"><FaLinkedin /></button>
                <button className="p-2 hover:bg-gray-100 rounded-full"><FaWhatsapp /></button>
              </div>
            </div>
          </div> */}
        </div>

        <SupplierUpdateField
          data={supProductsIdData}
          open={openModal}
          onClose={() => setOpenModal(null)}
          images={mediaImages}
          attachments={mediaAttachments}
          fields={fields as any}
          onSave={handleSave}
        />

      </div>
    </div>
  );
};

export default EditSupProduct;

