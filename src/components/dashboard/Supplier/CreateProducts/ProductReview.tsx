

import React, { useState } from 'react'
// TODO: Migrate CircularProgress from @mui/material
// TODO: Migrate Stepper from @mui/material
// TODO: Migrate Step from @mui/material
// TODO: Migrate StepLabel from @mui/material
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/input';
// TODO: Migrate InputLabel from @mui/material
// TODO: Migrate FormHelperText from @mui/material
import { MenuItem } from '@/components/ui/menu';
// TODO: Migrate FormControl from @mui/material
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
// TODO: Migrate ListItemText from @mui/material
import { Box } from '@/components/ui/box';
import { PiWarningLight } from "react-icons/pi";
import { useDispatch, useSelector } from 'react-redux';
import { MdNavigateBefore, MdNavigateNext } from 'react-icons/md';
import { toast } from 'sonner';
import { useCreateProductMutation } from '@/redux/features/supplier-products/products_api';
import { clearAllFilesFromIndexedDB, getAllFilesFromIndexedDBForServer } from '@/utils/indexDb';
import { resetProductState, setProductSuccessData } from '@/redux/features/supplier-products/products_slice';
import { useAppSelector } from '@/redux';
import Link from 'next/link';
import { CircularProgress } from '@/components/ui';

const SupplierProductReview = ({ handleNext, setActiveStep, activeStep, handleBack }:
  {
    handleNext: () => void;
    setActiveStep: (step: number) => void;
    activeStep: number;
    handleBack: () => void;
  }
) => {
    const { productPaymentData, productLocation, uploadedFiles, productDetailsFormData, serverReadyData, serverReadyImagesData, serverReadyAttachmentData, productSuccessData  } = useAppSelector((state) => state?.product);
    const { color, composition, deliveryPeriod, density, hardness, measure, prevPrice, productCategory, productName, productSubCategory, quantity, realPrice, } = productDetailsFormData;
    const { selectedCountryName, selectedState, fullAddress,  } = productLocation;
    const [currentIndex, setCurrentIndex] = React.useState(0);
      const { user } = useAppSelector((state) => state?.auth);
      const dispatch = useDispatch();
    
    const [mineralImages, setMineralImages] = React.useState(
        uploadedFiles?.map(() => ({
            currentIndex: 0
        }))
    )
    console.log('the urls,', uploadedFiles)
    
    const [createProduct, { isLoading }] = useCreateProductMutation();

    const handleNextImage = () => {
        setCurrentIndex((currentIndex + 1) % (uploadedFiles?.length || 1));
    }
    const handleNextStep = () => { handleNext() };
    const handlePrev = () => {
        setCurrentIndex((currentIndex - 1 + (uploadedFiles?.length || 1)) % (uploadedFiles?.length || 1));
    }
    const imageContainerStyle = {
        width: `${uploadedFiles?.length * 100}%`,
        transform: `translateX(-${(currentIndex / uploadedFiles?.length) * 100}%)`,
        transition: "transform 0.5s ease-in-out",
    } 
     

    console.log('all the supplier product data for submission  ====  uploadedFiles', uploadedFiles, )
    // console.log('all the supplier product data for submission  ====  productLocation', productLocation, )
    // console.log('all the supplier product data for submission  ====  productPaymentData', productPaymentData )
    // console.log('all the supplier product data for submission  ====  productDetailsFormData', productDetailsFormData )

    // console.log('all serverReadyData', serverReadyData )
    // console.log('all serverReadyImagesData', serverReadyImagesData )
    // console.log('all serverReadyAttachmentData', serverReadyAttachmentData )

    // const paylaod  = {
    //     serverReadyData,
    //     serverReadyImagesData,
    //     serverReadyAttachmentData,
    //   }

    const paylaod  = {
        productName: serverReadyData
        // serverReadyImagesData,
        // serverReadyAttachmentData,
      }

    console.log('time', paylaod );
    

     const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
      
        try {
          // ValidatING  before submission

          const paylaod  = {
            productName: serverReadyData?.productName
            // serverReadyImagesData,
            // serverReadyAttachmentData,
          }

          const payloads = {
            supplierId: user?.id,
            productName: productDetailsFormData.productName,
            productCategory: productDetailsFormData.productCategory,
            productSubCategory: productDetailsFormData.productSubCategory,
            color: productDetailsFormData.color,
            composition: productDetailsFormData.composition,
            deliveryPeriod: productDetailsFormData.deliveryPeriod,
            density: productDetailsFormData.density,
            hardness: productDetailsFormData.hardness,
            measure: productDetailsFormData.measure,
            prevPrice: productDetailsFormData.prevPrice,
            realPrice: productDetailsFormData.realPrice,
            quantity: productDetailsFormData.quantity,
            
            // Location data
            fullAddress: productLocation.fullAddress,
            latitude: productLocation.latitude,
            longitude: productLocation.longitude,
            selectedCountryName: productLocation.selectedCountryName,
            selectedState: productLocation.selectedState,
            streetNo: productLocation.streetNo || productLocation.fullAddress,
            zipCode: productLocation.zipCode,
            
            // Payment data
            selectedPayments: productPaymentData.selectedPayments,
            selectedShipping: productPaymentData.selectedShipping,
            paymentsTermsDescribed: productPaymentData.paymentsTermsDescribed,
            shippingTermsDescribed: productPaymentData.shippingTermsDescribed,
            
            // Description data
            productHeaderDescription: serverReadyData.productHeaderDescription || "Product Description",
            productDetailDescription: serverReadyData.productDetailDescription || {},
            
            // Media data
            imagesUrls: serverReadyImagesData,
            attachmentUrls: serverReadyAttachmentData,
            
            // Status data
            step: 4,
          };
        // Create FormData object
            const formData = new FormData();

            // Object.entries(serverReadyData).forEach(([key, value]) => {
            //     if (value !== undefined && value !== null) {
            //       formData.append(key, value);
            //     }
            //   });

            // Add all product details
            formData.append('productName', serverReadyData.productName);
            formData.append('productCategory', serverReadyData.productCategory);
            formData.append('productSubCategory', serverReadyData.productSubCategory);
            formData.append('color', serverReadyData.color);
            formData.append('composition', serverReadyData.composition);
            formData.append('deliveryPeriod', serverReadyData.deliveryPeriod);
            formData.append('density', serverReadyData.density);
            formData.append('hardness', serverReadyData.hardness);
            formData.append('measure', serverReadyData.measure);
            formData.append('prevPrice', serverReadyData.prevPrice);
            formData.append('realPrice', serverReadyData.realPrice);
            formData.append('quantity', serverReadyData.quantity);
            
            // Add location data
            formData.append('fullAddress', serverReadyData.fullAddress);
            formData.append('latitude', serverReadyData.latitude);
            formData.append('longitude', serverReadyData.longitude);
            formData.append('selectedCountryName', serverReadyData.selectedCountryName);
            formData.append('selectedState', serverReadyData.selectedState);
            formData.append('streetNo', serverReadyData.streetNo || serverReadyData.fullAddress);
            formData.append('zipCode', serverReadyData.zipCode);
            formData.append('productMainCategory', serverReadyData.productMainCategory);
            formData.append('categoryTag', serverReadyData.categoryTag);
            
            // Add payment data
            if (productPaymentData?.selectedPayments) {
                productPaymentData.selectedPayments.forEach((payment: string, index: number) => {
                  formData.append(`selectedPayments`, payment);
                });
              }
              
            if (productPaymentData?.selectedShippings) {
            productPaymentData.selectedShippings.forEach((shipping: string, index: number) => {
                formData.append(`selectedShipping`, shipping);
            });
            }
            // formData.append('selectedPayments', JSON.stringify(serverReadyData.selectedPayments));
            // formData.append('selectedShipping', JSON.stringify(serverReadyData.selectedShipping));
            formData.append('paymentsTermsDescribed', serverReadyData.paymentsTermsDescribed);
            formData.append('shippingTermsDescribed', serverReadyData.shippingTermsDescribed);
            
            // Add description data
            formData.append('productHeaderDescription', serverReadyData.productHeaderDescription || "Product Description");
            formData.append('productDetailDescription', JSON.stringify(serverReadyData.productDetailDescription || []));
            
            // Add step
            formData.append('step', 4 as any);

            const [imageFiles, attachmentFiles] = await Promise.all([
                getAllFilesFromIndexedDBForServer('ProductImages'),
                getAllFilesFromIndexedDBForServer('ProductAttachment')
              ]);
          
              console.log('Product Images Files:', imageFiles.join(', '));
              // Add image files
              if (imageFiles && imageFiles.length > 0) {
                imageFiles.forEach((file) => {
                  console.log('Appending image file:', file.name, file.type, file.size);
                  formData.append('productImages', file);
                });
                // formData.append('productImages', imageFiles.join(', '));
              } else {
                console.warn('No image files to upload');
              }
        
              // Add attachment files
              if (attachmentFiles && attachmentFiles.length > 0) {
                attachmentFiles.forEach((file) => {
                  console.log('Appending attachment file:', file.name, file.type, file.size);
                  formData.append('productAttachments', file);
                });
                // formData.append('productAttachments', attachmentFiles.join(', '));
              } else {
                console.warn('No attachment files to upload');
              }

              
          
          const response = await createProduct({
            supplierId: user?.id,
            body: formData
          }).unwrap(); 
          
        //   console.log('API Response:', response);
          toast.success(`${response?.message || 'Product listed successfully!'}`, {
            position: 'top-right',
            duration: 3000,
            style: {
              background: '#4CAF50',
              color: '#fff',
            },
          });

          console.log('Product submitted', response);
          dispatch(setProductSuccessData({
            productName: response?.product?.product_name || '',
            productId: response?.product?.id || '',
          }));

          dispatch(resetProductState());
          clearAllFilesFromIndexedDB('ProductImages').then((data) => {
            console.log('all indexdb data cleared:', data);
          }).catch((error) => {
            console.error('Error:', error);
          });

          clearAllFilesFromIndexedDB('ProductAttachment').then((data) => {
            console.log('all indexdb data cleared:', data);
          }).catch((error) => {
            console.error('Error:', error);
          });
          handleNext();
          
        } catch (error: any) {
          console.error('Error during form submission:', error);
          toast.error(`${error?.data?.message ||  'Failed to submit product details. Please try again.'}`, {
            duration: 3000,
            position: 'top-right',
            style: {
              background: '#f44336',
              color: '#fff',
            },
          });
        }
      };

      console.log('productSuccessData', productSuccessData)

    return (
        <div>
            <div className="">
                {/* Example Form */}
                <h2 className='font-bold text-xl my-6 text-center text-gray-600'>Kindly review some information</h2>
                <form
                    onSubmit={handleSubmit}
                    className="">

                    <div className='relative  '>

                        <div className=' relative  scroll-smooth '>
                            <div className='gap-[10px]  '>
                                <div 
                                className={` group flex w-full  mx-auto max-w-[320px] flex-col shadow-sm shadow-[#0000002a] mb-[14px] bg-[#fff]  pt-[10px] px-[10px] rounded-[15px] pb-[10px] min-h-full `}
                                >
                                    {/* images  */}
                                    <div>
                                        <div className={`max-w-[320px] w-full    widget_image_container  relative h-[230px]  p `}>
                                            <Link href='' className="w-full h-full flex" style={imageContainerStyle}>
                                                {uploadedFiles?.map((j, i) => (
                                                    <div
                                                        className={`relative w-full h-full  rounded-t-xl overflow-hidden `}
                                                        key={i}
                                                    >
                                                        <img
                                                            src={j.url}
                                                            alt="house"
                                                            className="w-full h-full object-cover rounded-[20px]"
                                                        />
                                                    </div>
                                                ))}
                                            </Link>
                                            {/* next and previous button */}
                                            <Box sx={{ position: '' }} className=' transition-opacity duration-300 group-hover:opacity-100'>
                                                <div
                                                    onClick={handleNextImage}
                                                    className=" absolute  z-[10] cursor-pointer right-2 top-[50%]"
                                                >
                                                    <MdNavigateNext className="text-gray-200 bg-[#727272] w-[20px] h-[20px] rounded-full text-[22px]" />
                                                </div>
                                                <div
                                                    onClick={handlePrev}
                                                    className=" absolute cursor-pointer  z-[10] left-2 top-[50%]"
                                                >
                                                    <MdNavigateBefore className="text-gray-200 bg-[#727272] w-[20px] h-[20px] rounded-full text-[22px]" />
                                                </div>
                                            </Box>
                                        </div>
                                        <div className="">
                                            <div className="flex justify-center mt-[3px] gap-[10px]">
                                                {uploadedFiles?.map((j, i) => {
                                                    return (
                                                        <div
                                                            key={i}
                                                            className={`rounded-full w-2 h-2 ${currentIndex === i ? "bg-[#000] " : "bg-gray-300"
                                                                }`}
                                                        ></div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Products description */}
                                    <div>
                                        <h2 className='pt-[5px] sm:text-[15px] text-[13px] font-[500]'>{productName}</h2>
                                      <div className='pt-[10px]'>
                                      {realPrice && (    
                                            <span className='sm:text-[24px] text-[1.1rem] font-[700]'>${realPrice}</span>
                                        )}
                                        {!prevPrice && ( 
                                         <span className='text-[14px] text-right font-[400] pl-[10px] text-[#666666]'><del>${prevPrice}</del></span>
                                        )}
                                        </div>
                                        {quantity && (<div className='py-[px]'>
                                            <span className='sm:text-[15px] text-[12px] font-[400]'>M.O.Q:</span>
                                            <span className='sm:text-[15px] text-[12px] font-[400] pl-[10px]'>{quantity} {measure}</span>
                                        </div>)}
                                        {deliveryPeriod && (<div className='py-[px]'>
                                            <span className='sm:text-[15px] text-[12px] font-[400]'>Del.Period:</span>
                                            <span className='sm:text-[15px] text-[12px] font-[400] pl-[10px]'>{deliveryPeriod}</span>
                                        </div>)}
                                        {selectedCountryName && ( <div className='py-[px]'>
                                            <span className='sm:text-[15px] text-[12px] font-[400]'>Location:</span>
                                            <span className='sm:text-[15px] text-[12px] font-[400] pl-[10px]'>{selectedCountryName}</span>
                                        </div>)}
                                        {selectedState && ( <div className='py-[px]'>
                                            <span className='sm:text-[15px] text-[12px] font-[400]'>State:</span>
                                            <span className='sm:text-[15px] text-[12px] font-[400] pl-[10px]'>{selectedState}</span>
                                        </div>)}
                                        {/* {company && (<div className='pt-[20px] flex gap-[10px]'>
                                            <img src={countryFlag} alt='Minmeg Country Image' />
                                            <span className='sm:text-[15px] text-[12px] font-[500] underline'>{company}</span>
                                        </div>)} */}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="flex pt-[30px] gap-[20px] justify-between mt-4">
                        <Button
                            disabled={activeStep === 0}
                            onClick={handleBack}
                            variant="outlined"
                            color="primary"
                            className="w-full"
                            type='button'
                        >
                            Back
                        </Button>
                        <Button
                            disabled={isLoading || activeStep === steps.length - 1} 
                            variant="contained"
                            color="primary"
                            className="w-full min-h-[48px] !text-white !bg-primary !border-primary !border !border-solid disabled:!bg-primary disabled:!border-primary disabled:!text-white " 
                            type="submit"
                        >
                            {isLoading ? (
                            <CircularProgress
                                size={24} 
                                color="inherit" 
                                className="text-white" // Makes spinner visible on primary button
                            />
                            ) : (
                             "Upload Product"
                            )}
                        </Button>
                    </div>
                </form>
                {/* Add other step forms here */}
            </div>
        </div>
    )
}

export default SupplierProductReview

const steps = [
    "Create Product",
    "Product Location",
    "Payment terms",
    "Product Review",
    "Confirm Product Information",
];

// const paymentTerms = [
//   { code: "T/T", name: "Telegraphic Transfer" },
//   { code: "L/C", name: "Letter of Credit" },
//   { code: "D/P", name: "Documents Against Payment" },
//   { code: "D/A", name: "Documents Against Acceptance" },
//   { code: "D/D", name: "Demand Draft" },
//   { code: "PayPal", name: "Online Payment Service" },
//   { code: "Other", name: "Other" },
// ];

// const shippingTerms = [
//   { code: "EXW", name: "Ex Works" },
//   { code: "FAS", name: "Free Alongside Ship" },
//   { code: "FOB", name: "Free On Board" },
//   { code: "FCA", name: "Free Carrier" },
//   { code: "CFR", name: "Cost and Freight" },
//   { code: "CPT", name: "Carriage Paid To" },
//   { code: "CIF", name: "Cost, Insurance, and Freight" },
//   { code: "DAP", name: "Delivered At Place" },
//   { code: "DDP", name: "Delivered Duty Paid" },
//   { code: "DPU", name: "Delivered at Place Unloaded" },
//   { code: "Other", name: "Other" },
// ];