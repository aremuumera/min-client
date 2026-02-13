// import { Select } from '@/components/ui/select';
import { Typography } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/input';
import { Stack } from '@/components/ui/stack';
import { Box } from '@/components/ui/box';
import React, { useEffect, useState } from 'react';
import CustomModal from '@/utils/CustomModal';
import { paths } from '@/config/paths';
import {
  MdContentCopy as CopyIcon,
  MdEdit as EditIcon,
  MdShare as ShareIcon,
} from 'react-icons/md';
import {
  FaFacebook as Facebook,
  FaLinkedin as LinkedIn,
  FaTwitter as Twitter,
  FaWhatsapp as WhatsApp,
} from 'react-icons/fa';


import { IconButton } from '@/components/ui/icon-button';
import { Modal } from '@/components/ui/modal';
import { Tooltip } from '@/components/ui/tooltip';
import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
// import { CopyToClipboard } from 'react-copy-to-clipboard';
import { IoIosArrowBack } from 'react-icons/io';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Country, State } from "country-state-city";
import { Option } from '@/components/core/option';

import { mockData } from '../ListedRfqs';
import RfqInputEditModal from './InpputEditModal';
import { Moq } from '@/components/marketplace/layout/sidebar';
// If not found, define it.
import { paymentTerms, shippingTerms as shippingTermsFields } from '@/components/dashboard/Supplier/CreateProducts/paymentTerms'; // Corrected path?
import { useGetRfqDetailsForbuyQuery } from '@/redux/features/buyer-rfq/rfq-api';
import { useSelector } from 'react-redux';
import { formatDate } from '@/utils/helper';
import Loader from '@/lib/Loader';
import { useGetCategoryQuery, useGetMainCategoryQuery, useGetSubCategoryQuery } from '@/redux/features/categories/cat_api';

const EditRfQs = ({ open, rows, onClose }: any) => {
  const [rfqIdData, setRfqIdData] = useState<any>([]);
  const router = useRouter();
  const params = useParams();
  const listedRfqId = params?.listedRfqId as string;
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [copied, setCopied] = useState(false);
  const [fields, setFields] = useState<any[]>([]);
  const [mediaAttachments, setMediaAttachments] = useState([]);


  const { user, appData } = useSelector((state: any) => state.auth);

  const exampleRoute = 'http://localhost:3000/products/details/2/High-Purity-Limestone-for-Industrial-Use'

  const { data, isLoading, isError } = useGetRfqDetailsForbuyQuery({
    buyerId: user?.id,
    rfqId: listedRfqId
  },
    {
      // refetchOnMountOrArgChange: true,
      // skip: !user?.id || !listedSupplierProductId,
    }
  );

  const theProd = data?.data

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

  // No changes needed here, just for alignment

  useEffect(() => {
    if (data?.data) {
      setRfqIdData(data?.data);
      setMediaAttachments(data?.data?.attachments);
    }
    setCurrentCategories({
      main: data?.data?.rfqProductMainCategory || '',
      product: data?.data?.rfqProductCategory || '',
      sub: data?.data?.rfqProductSubCategory || '',
      catTag: data?.data?.category_tag || ''
    });
  }, [data?.data, listedRfqId, router.push]);

  const ProductImagesArray = Array.isArray(rfqIdData?.attachments)
    ? rfqIdData.attachments
    : [rfqIdData?.attachments];

  //  select fields data
  const categoryFields = ['Minerals']

  const quantityMeasureField = Moq;

  const subCategoryField = ['Metallic minerals', 'Non-metallic Industrial minerals', 'Marble and Natural Stone', 'Gravel, Sand or Aggregate', 'Coal', 'Gems', 'Others'];

  const paymentTermsField = paymentTerms;

  const shippingTermsField = shippingTermsFields;


  const {
    deliveryPeriod,
    durationOfSupply,
    productDestination,
    quantityMeasure,
    quantityRequired,
    rfqDescription,
    rfqProductCategory,
    rfqProductName,
    rfqProductSubCategory,
    selectedPayments,
    selectedShippings,
    shippingTermsDescribed,
    paymentsTermsDescribed,
    status,
    buyer,
    createdAt,
    attachments
  } = rfqIdData

  //   const sections = [
  //     { id: 'category', title: 'Category', content: 'Granulated Shaden Crystal is a premium-grade...' },
  //     { id: 'quantity', title: 'Quantity', content: '100kg/tons' },
  //     { id: 'duration', title: 'Duration of supply', content: '1 month 2 weeks' },
  //     { id: 'expiryDate', title: 'Expiration Date', content: '1 month 2 weeks' },
  //     { id: 'shipping', title: 'Shipping terms', content: 'Granulated Shaden Crystal...' },
  //     { id: 'address', title: 'Address', content: '18 Allen Street Igan Road, Ogun State, Nigeria' },
  //   ];

  // const { category, name, rfqId, subCategory, paymentTermsDescribed,  durationOfSupply,
  //   shippingTermsDescribed, rfqDescription, state, deliveryPeriod, quantityMeasure,  dateCreated, Location, quantity, expirationDate, Destination, shippingTerms, PaymentTerms, status } = rfqIdData;

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

    // category: {
    //   id: 'category',
    //   type: 'select',
    //   label: 'Category',
    //   value: rfqProductCategory,
    //   multipleFields: false,
    //   selectCategoryName: 'rfqCategory',
    //   options: categoryFields
    // },
    // subCategory: {
    //   id: 'subCategory',
    //   type: 'select',
    //   label: 'Sub Category',
    //   value: rfqProductSubCategory,
    //   multipleFields: false,
    //   selectCategoryName: 'rfqSubCategory',
    //   options: subCategoryField 
    // },
    quantity: {
      id: 'quantity',
      type: 'text',
      label: 'Quantity',
      value: quantityRequired,
    },
    rfqProductName: {
      id: 'rfqProductName',
      type: 'text',
      label: 'RFQ Product Name',
      value: rfqProductName,
    },
    quantityMeasure: {
      id: 'quantityMeasure',
      type: 'select',
      label: 'Quantity Measure',
      value: quantityMeasure,
      multipleFields: false,
      selectCategoryName: 'quantityMeasure',
      options: quantityMeasureField,
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
      multipleFields: true,
      selectCategoryName: 'shippingTerms',
      options: shippingTermsField,
      value: selectedShippings,
    },
    PaymentTerms: {
      id: 'PaymentTerms',
      type: 'select',
      label: 'Payment Terms',
      value: selectedPayments,
      multipleFields: true,
      selectCategoryName: 'PaymentTerms',
      options: paymentTermsField,
    },
    // destination: {
    //     id: 'Destination',
    //     type: 'text',
    //     label: 'Destination',
    //     value: productDestination,
    // },
    status: {
      id: 'status',
      type: 'select',
      label: 'status',
      value: status,
      multipleFields: false,
      selectCategoryName: 'status',
      options: ['unavailable', 'pending', 'expired', 'confirmed', 'accepted'],
    },
    location: {
      id: 'location',
      type: 'select',
      label: 'Destination',
      value: productDestination,
      multipleFields: false,
      selectCategoryName: 'location',
      options: [],
    },
    //   state: {
    //     id: 'state',
    //     type: 'select',
    //     label: 'State',
    //     value: state,
    //     multipleFields: false,
    //     selectCategoryName: 'state',
    //     options: [],
    // },
    name: {
      id: 'name',
      type: 'text',
      label: 'name',
      value: rfqProductName,
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
    deliveryPeriod: {
      id: 'deliveryPeriod',
      type: 'text',
      label: 'Delivery Period',
      value: deliveryPeriod,
    },
    durationOfSupply: {
      id: 'durationOfSupply',
      type: 'text',
      label: 'Duration of Supply',
      value: durationOfSupply,
    },
    rfqDescription: {
      id: 'rfqDescription',
      type: 'text',
      label: 'Duration of Supply',
      value: rfqDescription,
    },
    productAttachment: {
      id: 'productAttachment',
      type: 'file',
      label: 'RFQ Attachment',
      value: attachments,
    },
  };

  // useEffect(() => {
  //   if (mockData && Array.isArray(mockData) && mockData.length > 0 && listedRfqId !== undefined ) {
  //     const data = mockData.find((mock) => mock.rfqId  === Number(listedRfqId));
  //     if (data) {
  //       setRfqIdData(data);
  //   }
  //    else {
  //       navigate('/dashboard/rfq-list', { replace: true });
  //     }
  //   } else {
  //     navigate('/dashboard/rfq-list', { replace: true });
  //   }
  // }, [mockData, listedRfqId, navigate]);

  const dynamicFields = [
    {
      label: 'Categories',
      value: `${currentCategories.main}${currentCategories.product ? ` > ${currentCategories.product}` : ''}${currentCategories.sub ? ` > ${currentCategories.sub}` : ''}`,
      key: 'productCategories'
    },
    { label: 'RFQ Product Name', value: rfqProductName, key: 'rfqProductName' },
    // { label: 'Category', value: rfqProductCategory, key: 'category' },
    // { label: 'Sub Category', value: rfqProductSubCategory, key: 'subCategory' },
    { label: 'Quantity', value: quantityRequired, key: 'quantity' },
    // { label: 'Expiration Date', value: 'expirationDate', key: 'expirationDate' },
    { label: 'Product Destination', value: productDestination, key: 'location' },
    // { label: 'Product Destination', value: productDestination, key: 'destination' },
    { label: 'Shipping Terms', value: selectedShippings?.join(', '), key: 'shippingTerms' },
    { label: 'Payment Terms', value: selectedPayments?.join(', '), key: 'PaymentTerms' },
    { label: 'Status', value: status, key: 'status' },
    { label: 'Quantity Measure', value: quantityMeasure, key: 'quantityMeasure' },
    // { label: 'State', value: 'state', key: 'state' },
    { label: 'Payment Terms Described', value: paymentsTermsDescribed, key: 'paymentTermsDescribed' },
    { label: 'Shipping Terms Described', value: shippingTermsDescribed, key: 'shippingTermsDescribed' },
    { label: 'Delivery Period', value: deliveryPeriod, key: 'deliveryPeriod' },
    { label: 'Duration Of Supply', value: durationOfSupply, key: 'durationOfSupply' },
    { label: 'RFQ Description', value: rfqDescription, key: 'rfqDescription' },
  ];


  const handleOpenModal = (field: string) => {
    setFields([(fieldConfigurations as any)[field]]);
    setOpenModal(true);
  };

  const handleSave = (updatedData: any) => {
    console.log('Updated Data:', updatedData);
    // Apply updated data to your state or server here.
  };

  if (isLoading) return <div><Loader /></div>;
  if (isError) return <div>Error loading profile</div>;
  if (!data) return <div>No profile data found</div>;
  if (!rfqIdData) return <div>No RFQ data found</div>;

  return (
    <div>
      <div className="w-full !relative ">
        <div className="flex px-[12px] py-[30px] justify-between items-center">
          <div>
            <Link className="flex justify-center items-center gap-[6px]" href={paths.dashboard.rfqs.list}>
              <IoIosArrowBack /> Back
            </Link>
          </div>
          <div>
            <Button onClick={() => router.push(paths.dashboard.rfqs.create)} startIcon={<PlusIcon />} variant="contained">
              Create Rfq
            </Button>
          </div>
        </div>
        <div className="p-4 space-y-4 !relative   bg-white shadow rounded-lg">
          <div className="flex lg:h-[10vh] h-full  justify-between items-center py-[6px]">
            <div>
              <h2 className="text-[2rem]  font-[700]">{rfqProductName}</h2>
              <p className="pt-[5px] text-[#a8a8a8]">Posted on {formatDate(createdAt)}</p>
            </div>
          </div>

          <h3 className="font-semibold !text-left">{'Attachment'}</h3>
          <div className="relative flex items-start space-x-2">
            <div className="flex relative overflow-x-auto space-x-2">
              {ProductImagesArray?.length > 0 && ProductImagesArray?.map((img: any, i: number) => (
                <div key={i} className="w-40 h-32 o rounded flex-shrink-0">
                  <img src={img?.url} alt="" className='' />
                </div>
              ))}
              <div >
              </div>
            </div>
            <Button
              sx={{
                position: 'absolute',
                right: 0,
                zIndex: 10,
                bgcolor: 'white',
                borderRadius: 0,
                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
              }} onClick={() => handleOpenModal('productAttachment')} size="sm" startIcon={<EditIcon />}>
              Edit Attachment
            </Button>
          </div>


          <div className="overflow-y-auto max-h-full pt-12 space-y-4">
            {dynamicFields.map((field: any) => (
              <div
                key={field.key}
                className={`flex justify-between items-center ${field.fullWidth ? 'gap-[10px]' : ''}`}
              >
                <div className={`flex flex-col justify-start ${field.fullWidth ? 'w-full max-w-[800px]' : ''}`}>
                  <h3 className="font-semibold !text-left">{field.label}</h3>
                  <p className="text-sm max-w-[200px] truncate text-gray-600">{field.value}</p>
                </div>
                <Button
                  onClick={() => handleOpenModal(field.key)}
                  size="sm"
                  startIcon={<EditIcon />}
                >
                  Edit
                </Button>
              </div>
            ))}
          </div>


          {/* Copy & Share Section */}
          {/* <div className="fixed my-[20px] bottom-[20px] left-[18rem]  max-w-[90%] md:max-w-[300px] right-[30px] bg-gray-100 p-2 shadow-md"> */}
          <div className="flex md:flex-row flex-col gap-[20px] pb-10 justify-end items-center  bg-gray-100 p-2 rounded">
            {/* <CopyToClipboard
              className="py-[25px] w-full max-w-[300px] !border-[2px] border-primary bg-white rounded-[15px]"
              text="SYYH89rhfbdu..."
              onCopy={() => setCopied(true)}
            >
              <Tooltip title={copied ? 'Copied!' : 'Copy'}>
                <IconButton>
                  <p className="text-[.8rem] pr-[6px]">Copy</p>
                  <CopyIcon className="text-[1rem]" />
                </IconButton>
              </Tooltip>
            </CopyToClipboard> */}

            {/* share button */}
            {/* <Tooltip
                sx={ {
                bgcolor: 'white', 
                }}
                className="!bg-white"
              title={
                <Box sx={{bgcolor: 'white'}} className="flex!bg-white space-x-2">
                   <Link to={'/'}>
                        <IconButton>
                            <Facebook />
                        </IconButton>
                   </Link>
                   <Link to={'/'}>
                    <IconButton>
                        <Twitter />
                    </IconButton>
                   </Link>
                  <Link to={'/'}>
                    <IconButton>
                        <LinkedIn />
                    </IconButton>
                  </Link>
                  <Link to={'/'}>
                    <IconButton
                    >
                        <WhatsApp className='!text-primary' />
                    </IconButton>
                  </Link>
                </Box>
              }
              arrow
              interactive
            >
              <Button variant="contained" width="50%" className="w-full max-w-[300px]">
                <IconButton>
                  <p className="text-[1rem] text-white pr-[6px]">Share</p>
                  <ShareIcon className="text-[1rem] text-white" />
                </IconButton>
              </Button>
            </Tooltip> */}
          </div>
        </div>
        {/* </div> */}
        <RfqInputEditModal
          data={rfqIdData}
          open={openModal}
          onClose={() => setOpenModal(false)}
          attachments={mediaAttachments}
          fields={fields}
          onSave={handleSave}
        />
      </div>
    </div>
  );
};

export default EditRfQs;
