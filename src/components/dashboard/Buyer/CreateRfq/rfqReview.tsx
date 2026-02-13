

import React, { useState } from 'react'
import { TextField } from '@/components/ui/input';
import { FormControl, InputLabel, FormHelperText } from '@/components/ui/form-control';
import { MenuItem } from '@/components/ui/menu';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ListItemText } from '@/components/ui/list'; 
import { Box } from '@/components/ui/box';
import { PiWarningLight } from "react-icons/pi";
import { useDispatch, useSelector } from 'react-redux';
import { MdNavigateBefore, MdNavigateNext, MdPerson as Person, MdCalendarToday as CalendarToday } from 'react-icons/md';
import { Card, CardContent, CardActions } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { formatCompanyNameForUrl } from '@/utils/UrlFormatter';
    import { useAppSelector } from '@/redux';

const RfQProductReview = ({ handleNext, setActiveStep, activeStep, handleBack }: { handleNext: () => void, setActiveStep: (step: number) => void, activeStep: number, handleBack: () => void }) => {
    const { rfqProductDetailsFormData } = useAppSelector((state) => state?.rfqProduct);
    const {  rfqProductCategory,  rfqProductSubCategory,   selectedShippings, selectedPayments, 
        quantityMeasure, deliveryPeriod,   durationOfSupply,  paymentTermsDescribed, 
        quantityRequired,  rfqDescription,  rfqProductName,  selectedCountry, 
        selectedCountryName,  selectedState,  selectedStateName,   shippingTermsDescribed,  streetNo, 
        zipCode 
      } = rfqProductDetailsFormData;
      
      console.log(rfqProductSubCategory, selectedCountryName, streetNo, zipCode);
      

      const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        handleNext();
    }

    return (
        <div>
            <div className="">
                {/* Example Form */}
                <h2 className='font-bold text-xl my-6 text-center text-gray-600'>Kindly review your rfq's information card</h2>
                <form
                    onSubmit={handleSubmit}
                    className="">

                    <div className='relative  mx-auto max-w-[500px] '>

                        <Card className="shadow-md hover:shadow-lg transition-shadow">
                            <CardContent>
                                <div className="flex items-center justify-between mb-3">
                                    <Typography className="flex items-center text-primary text-sm  font-medium">
                                        <Person className="mr-1 text-primary" /> {'Aremu'} - {selectedCountry}
                                    </Typography>
                                    <Typography className="flex items-center text-primary bg-[#CCE6CC70] px-[8px] py-[5px] rounded-[10px] text-sm font-medium">
                                        <CalendarToday className="mr-1" /> {'02-01-2025'}
                                    </Typography>
                                </div>
                                <Typography className="text-sm font-[500] text-gray-800 mb-3">
                                    {'I am looking for this mineral to for a quick production'}
                                </Typography>
                                <div className="text-sm text-gray-600">
                                    <p>
                                        <span className="font-bold">Product: </span>
                                        {rfqProductName || 'Quartz'}
                                    </p>
                                    <p>
                                        <span className="font-bold">Quantity: </span>
                                        {quantityRequired || "50"} {quantityMeasure}
                                    </p>

                                    <p>
                                        <span className="font-bold">Duration of Supply: </span>
                                        {durationOfSupply || "5 months"} {durationOfSupply}
                                    </p>

                                    <p>
                                        <span className="font-bold">Location: </span>
                                         {selectedCountryName}
                                    </p>

                                    <p>
                                        <span className="font-bold">State: </span>
                                         {selectedStateName}
                                    </p>

                                    <p>
                                        <span className="font-bold">Delivery Period: </span>
                                        {deliveryPeriod || "2 months"}
                                    </p>
                                </div>
                            </CardContent>
                            {/* <CardActions className="flex justify-between px-3 pb-3">
                                <Button
                                    size="small"
                                    fullWidth
                                    className="!text-white !bg-green-600 hover:!bg-green-700"
                                >
                                    Contact Now
                                </Button>
                            </CardActions> */}
                        </Card>

                    </div>

                    <div className="flex pt-[30px] gap-[20px] justify-between mt-4">
                        <Button
                            disabled={activeStep === 0}
                            onClick={handleBack}
                            variant="outlined"
                            color="primary"
                            className="w-full"
                        >
                            Back
                        </Button>
                        <Button
                            disabled={activeStep === steps.length - 1}
                            variant="contained"
                            color="primary"
                            className="w-full"
                            type='submit'
                        >
                            {"Publish your RFQ"}
                        </Button>
                    </div>
                </form>
                {/* Add other step forms here */}
            </div>
        </div>
    )
}

export default RfQProductReview

const steps = [
    "RFQ’s details",
    // "Address details",
    // "RFQ Review",
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