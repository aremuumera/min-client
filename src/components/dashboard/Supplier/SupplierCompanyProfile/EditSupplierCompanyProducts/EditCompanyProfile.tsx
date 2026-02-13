import { Typography } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/input';
import { Stack } from '@/components/ui/stack';
import { Box } from '@/components/ui/box';
import React, { useEffect, useState } from 'react';
import { useGetStoreProfileQuery } from '@/redux/features/supplier-profile/supplier_profile_api';
import CustomModal from '@/utils/CustomModal';
import { formatDate } from '@/utils/helper';
import { paths } from '@/config/paths';

// import { Modal } from '@/components/ui/modal';
// import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useSelector } from 'react-redux';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { MdEdit } from 'react-icons/md';

// import { Option } from '@/components/core/option';

import { paymentTerms, shippingTerms as shippingTermsFields } from '../../CreateProducts/paymentTerms';
import { mockData } from '../../ListedProducts';
import SupplierProfileInputEditModal from './SupplierInputEditModal';

const EditCompanyProfile = ({ open, rows, onClose }: any) => {
  const [companyProfileData, setCompanyProfileData] = useState<any>([]);
  const router = useRouter();

  const { user, appData } = useSelector((state: any) => state.auth);

  const [openModal, setOpenModal] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [fields, setFields] = useState<any[]>([]);

  const { data, isLoading, isError } = useGetStoreProfileQuery(
    {
      supplierId: appData?.supPro,
      profileId: user?.id,
    },
    {
      skip: !appData?.supPro || !user?.id,
    }
  );

  useEffect(() => {
    if (data) {
      setCompanyProfileData(data);
    }
  }, [data, router]);

  const {
    banner: company_banner,
    business_type: businessType,
    businessCategory,
    company_description: companyDescription,
    company_email,
    company_facebook,
    company_instagram,
    company_linkedIn,
    company_name,
    company_phone,
    company_xSocial,
    description_fields,
    full_address: fullAddress,
    latitude,
    logo: company_logo,
    totalRevenue,
    logoPublicId,
    longitude,
    selected_country,
    selected_countryName: companyLocation,
    selected_state,
    streetNo,
    createdAt,
    total_employees: totalEmployees,
    updatedAt,
    year_established: yearsOfEstablish,
    year_experience: yearsOfExperience,
    zip_code: zipCode,
    selected_payments,
    selected_shippings,
    profileDetailDescription,
  } = companyProfileData || {};

  // console.log('data', data)

  // const { businessCategory, totalEmployees, yearsOfEstablish, companyDescription,  yearsOfExperience, companyName, companyLocation, businessType, totalRevenue, companyLogo,  companyBanner,
  //    shippingTerms, PaymentTerms,  mediaChannel,  zipCode,
  //    dateCreated, streetNo,  location, state,  quantity, fullAddress, paymentTermsDescribed, shippingTermsDescribed,
  //    longitude, latitude, Destination, status } = companyProfileData;

  const paymentTermsField = paymentTerms;

  const shippingTermsField = shippingTermsFields;

  const fieldConfigurations = {
    businessCategory: {
      id: 'businessCategory',
      type: 'select',
      label: 'Business Category',
      value: businessCategory,
      options: ['Metals', 'Non-metals', 'Others'],
    },
    companyDescription: {
      id: 'companyDescription',
      type: 'textBig',
      label: 'Company Description',
      value: companyDescription,
    },
    businessType: {
      id: 'businessType',
      type: 'select',
      label: 'Business Type',
      value: businessType,
      multipleFields: false,
      selectCategoryName: 'businessType',
      options: ['Metals', 'Non-metals', 'Others'],
    },
    totalRevenue: {
      id: 'totalRevenue',
      type: 'text',
      label: 'Total Revenue',
      value: totalRevenue,
    },
    totalEmployees: {
      id: 'totalEmployees',
      type: 'text',
      label: 'Total Employees',
      value: totalEmployees,
    },
    yearsOfEstablish: {
      id: 'yearsOfEstablish',
      type: 'text',
      label: 'Years of Establish',
      value: yearsOfEstablish,
    },
    yearsOfExperience: {
      id: 'yearsOfExperience',
      type: 'text',
      label: 'Years of Experience',
      value: yearsOfExperience,
    },
    companyLocation: {
      id: 'companyLocation',
      type: 'text',
      label: 'Company Location',
      value: companyLocation,
    },
    companyLogo: {
      id: 'companyLogo',
      type: 'file',
      label: 'Company Logo',
      value: company_logo,
    },
    companyBanner: {
      id: 'companyBanner',
      type: 'file',
      label: 'Company Banner',
      value: company_banner,
    },
    email: {
      id: 'email',
      type: 'text',
      label: 'Company Email',
      value: company_email,
    },
    phoneNumber: {
      id: 'phoneNumber',
      type: 'text',
      label: 'Media Channel',
      value: company_phone,
    },
    facebook: {
      id: 'facebook',
      type: 'text',
      label: 'Facebook media channel',
      value: company_facebook,
    },
    instagram: {
      id: 'instagram',
      type: 'text',
      label: 'Instagram media channel',
      value: company_instagram,
    },
    linkedin: {
      id: 'linkedin',
      type: 'text',
      label: 'Linkedin media channel',
      value: company_linkedIn,
    },
    XTwitter: {
      id: 'XTwitter',
      type: 'text',
      label: 'X (Twitter) media channel',
      value: company_xSocial,
    },
    fullAddress: {
      id: 'fullAddress',
      type: 'text',
      label: 'Full Address',
      value: fullAddress,
    },
    // shippingTermsDescribed: {
    //   id: 'shippingTermsDescribed',
    //   type: 'text',
    //   label: 'Shipping Terms Described',
    //   value: shippingTermsDescribed,
    // },
    // paymentTermsDescribed: {
    //   id: 'paymentTermsDescribed',
    //   type: 'text',
    //   label: 'Payment Terms Described',
    //   value: paymentTermsDescribed,
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
    profileDetailDescription: {
      id: 'profileDetailDescription',
      type: 'headerDescription',
      label: 'Product Detail Description',
      value: Array.isArray(profileDetailDescription) ? profileDetailDescription : [{ header: '', description: '' }],
    },
    // shippingTerms: {
    //   id: 'shippingTerms',
    //   type: 'select',
    //   label: 'Shipping Terms',
    //   value: shippingTerms,
    //   multipleFields: true,
    //   selectCategoryName: 'shippingTerms',
    //   options: shippingTermsField,
    // },
    // PaymentTerms: {
    //     id: 'PaymentTerms',
    //     type: 'select',
    //     label: 'Payment Terms',
    //     value: PaymentTerms,
    //     multipleFields: true,
    //     selectCategoryName: 'PaymentTerms',
    //     options: paymentTermsField,
    // },
  };

  const editableSections: { label: string; fieldName: string; value: any, key?: string }[] = [
    { label: 'Business Category', fieldName: 'businessCategory', value: businessCategory },
    {
      label: 'Company Description',
      fieldName: 'companyDescription',
      value: 'Click edit to edit your company description',
    },
    { label: 'Business Type', fieldName: 'businessType', value: businessType },
    { label: 'Total Employees', fieldName: 'totalEmployees', value: totalEmployees },
    { label: 'Years of Establish', fieldName: 'yearsOfEstablish', value: yearsOfEstablish },
    { label: 'Years of Experience', fieldName: 'yearsOfExperience', value: yearsOfExperience },
    { label: 'Full Address', fieldName: 'fullAddress', value: fullAddress },
    {
      label: 'Profile Detailed Description',
      fieldName: 'profileDetailDescription',
      value: 'Click edit to edit your Company Detail Description',
      key: 'profileDetailDescription',
    },
    // { label: 'Shipping Terms Described', fieldName: 'shippingTermsDescribed', value: shippingTermsDescribed },
    // { label: 'Payment Terms Described', fieldName: 'paymentTermsDescribed', value: paymentTermsDescribed },
    // { label: 'Shipping Terms', fieldName: 'shippingTerms', value: shippingTerms?.join(', ') },
    // { label: 'Payment Terms', fieldName: 'PaymentTerms', value: PaymentTerms?.join(', ') },
    { label: 'Longitude', fieldName: 'longitude', value: longitude },
    { label: 'Latitude', fieldName: 'latitude', value: latitude },
    { label: 'Company Email', fieldName: 'email', value: company_email },
    { label: 'Company Phone number', fieldName: 'phoneNumber', value: company_phone },
    { label: 'Facebook media', fieldName: 'facebook', value: company_facebook },
    { label: 'Instagram media', fieldName: 'instagram', value: company_instagram },
    { label: 'Linkedin media', fieldName: 'linkedin', value: company_linkedIn },
    { label: 'X (Twitter) media', fieldName: 'XTwitter', value: company_xSocial },
  ];

  const handleOpenModal = (field: string) => {
    const fieldConfig = (fieldConfigurations as any)[field] ;
    if (!fieldConfig) {
      console.error(`Field configuration not found for: ${field}`);
      return;
    }

    setFields([(fieldConfigurations as any)[field]]);
    setOpenModal(true);
  };

  const handleSave = (updatedData: any) => {
    console.log('Updated Data:', updatedData);
    // Apply updated data to your state or server here.
  };

  if (isLoading) return <div>Loading profile data...</div>;
  if (isError) return <div>Error loading profile</div>;
  if (!data) return <div>No profile data found</div>;

  return (
    <div>
      <div className="w-full !relative ">
        <div className="flex px-[12px] pb-[30px] justify-between items-center"></div>
        <div className="p-4 space-y-4 !relative   bg-white shadow rounded-lg">
          <div className="flex lg:h-[10vh] h-full  justify-between items-center py-[6px]">
            <div>
              <h2 className="text-[2rem]  font-[700]">{company_name || 'Aremu Mining Limited'}</h2>
              <p className="pt-[5px] text-[#a8a8a8]">created on {formatDate(createdAt)}</p>
            </div>
          </div>

          {/*logo Image Section */}
          <h3 className="font-semibold !text-left">{'Company Logo'}</h3>
          <div className="relative flex items-start space-x-2">
            <div className="flex relative overflow-x-auto space-x-2">
              <div className="w-40 h-32 o rounded flex-shrink-0">
                <img src={company_logo} alt="" className="" />
              </div>
              <div></div>
            </div>
            <Button
              className="absolute right-0 z-10 bg-white rounded-none shadow-md"
              style={{ boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)' }}
              onClick={() => handleOpenModal('companyLogo')}
              size="sm"
            >
              <MdEdit className="mr-2 text-lg" />
              Edit Logo
            </Button>
          </div>

          {/*Banner Image Section */}
          <h3 className="font-semibold !text-left">{'Company Banner'}</h3>
          <div className="relative flex items-start space-x-2">
            <div className="flex relative overflow-x-auto space-x-2">
              <div className="w-40 h-32 o rounded flex-shrink-0">
                <img src={company_banner} alt="" className="" />
              </div>
              <div></div>
            </div>
            <Button
              className="absolute right-0 z-10 bg-white rounded-none shadow-md"
              style={{ boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)' }}
              onClick={() => handleOpenModal('companyBanner')}
              size="sm"
            >
              <MdEdit className="mr-2 text-lg" />
              Edit Banner
            </Button>
          </div>

          {/* Editable Sections */}
          <div className="overflow-y-auto max-h-full pb-20 space-y-4">
            {editableSections.map((section, index) => (
              <EditableSection
                key={index}
                label={section.label}
                value={section.value}
                fieldName={section.fieldName}
                handleOpenModal={handleOpenModal}
              />
            ))}
          </div>

          {/* Copy & Share Section */}
          {/* <div className="fixed my-[20px] bottom-[20px] left-[18rem]  max-w-[90%] md:max-w-[300px] right-[30px] bg-gray-100 p-2 shadow-md"> */}
          {/* <div className="flex md:flex-row flex-col gap-[20px] justify-end items-center  bg-gray-100 p-2 rounded">
            <CopyToClipboard
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
            </CopyToClipboard>

            <Tooltip
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
            </Tooltip>

          </div> */}
        </div>
        {/* </div> */}
        <SupplierProfileInputEditModal
          data={companyProfileData}
          open={openModal}
          onClose={() => setOpenModal(null)}
          fields={fields || []}
          onSave={handleSave}
        />
      </div>
    </div>
  );
};

export default EditCompanyProfile;

const EditableSection = ({ label, value, fieldName, handleOpenModal }: any) => {
  return (
    <div className="flex justify-between items-center">
      <div className="flex flex-col justify-start">
        <h3 className="font-semibold !text-left">{label}</h3>
        <p className="text-sm text-gray-600 ">{value}</p>
      </div>
      <Button onClick={() => handleOpenModal(fieldName)} size="sm">
        <MdEdit className="mr-2" />
        Edit
      </Button>
    </div>
  );
};

export const supplierMockData = {
  companyName: 'Aremu Limited',
  totalEmployees: '11 - 50',
  yearsOfExperience: 20,
  yearsOfEstablish: 1940,
  companyDescription: [
    {
      header: 'About Us',
      description: 'Looking for a product to be shipped to Nigeria',
    },
    {
      header: 'About Our Mineral Researchessss',
      description: 'hh',
    },
  ],
  companyLocation: 'Nigeria',
  businessCategory: 'Mineral Producers',
  businessType: 'Distributor',
  totalRevenue: '12.5 million',
  companyLogo:
    'https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  companyBanner:
    'https://images.unsplash.com/photo-1609216970141-d981d693484a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  shippingTerms: ['CPT', 'FOB', 'CFR', 'FAS'],
  PaymentTerms: ['T/T', 'L/C', 'D/P'],
  mediaChannel: {
    email: 'aremu.scripter@gmail.com',
    phoneNumber: '080123456789',
    facebook: 'https://www.facebook.com',
    instagram: 'https://instagram.com',
    linkedin: 'https://www.linkedin.com',
    XTwitter: 'https https://www.x.com',
  },
  zipCode: 123456,
  streetNo: 'no 12',
  location: 'Nigeria',
  state: 'Lagos',
  fullAddress: 'no 12 delaware street, f-close',
  paymentTermsDescribed: 'This goods will be paid upon receival of samples at 50% upfront',
  shippingTermsDescribed: 'The is needed to be shipped for a duration of 3 weeks interval',
  longitude: '22.5345.8',
  latitude: '22.5345.8',
  profileCreated: false,
  dateCreated: '12th May, 2021',
};
