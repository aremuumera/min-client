// 3. Update your InvoiceAgreementModal.jsx

import React, { useEffect, useState } from 'react';
import { useGetDetailFfqQuery } from '@/redux/features/buyer-rfq/rfq-api';
import { useCreateInvoiceAgreementMutation, useUpdateInvoiceAgreementMutation } from '@/redux/features/invoice/invoice_api';
import { useGetAllProductDetailsQuery } from '@/redux/features/supplier-products/products_api';
import {
  X as CloseIcon,
  Info as InfoIcon,
  Circle as DotIcon
} from '@phosphor-icons/react/dist/ssr';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Grid,
  IconButton,
  Link,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Typography,
} from '@/components/ui';
import { useSelector } from 'react-redux';
import { useParams } from 'next/navigation';
import { z } from 'zod';

import { useAlert } from '@/providers';
import { Moq } from '@/components/marketplace/layout/sidebar';

import nigeriaLgas from '../../../utils/location-lga.json';
import nigeriaStates from '../../../utils/location-state.json';
import { sendInvoiceMessage } from '../chat/chat_service';

//  VALIDATION SCHEMAS
// import {
//   tradeDetailsSchema,
//   inspectionDetailsSchema,
//   completeInvoiceSchema
// } from '@/schemas/invoiceValidationSchema';

const steps = ['Trade Details', 'Inspection Details', 'Review & Submit'];
const timeSlots = [
  '12:00 AM',
  '12:15 AM',
  '12:30 AM',
  '12:45 AM',
  '1:00 AM',
  '1:15 AM',
  '1:30 AM',
  '1:45 AM',
  '2:00 AM',
  '2:15 AM',
  '2:30 AM',
  '2:45 AM',
  '3:00 AM',
  '3:15 AM',
  '3:30 AM',
  '3:45 AM',
  '4:00 AM',
  '4:15 AM',
  '4:30 AM',
  '4:45 AM',
  '5:00 AM',
  '5:15 AM',
  '5:30 AM',
  '5:45 AM',
  '6:00 AM',
  '6:15 AM',
  '6:30 AM',
  '6:45 AM',
  '7:00 AM',
  '7:15 AM',
  '7:30 AM',
  '7:45 AM',
  '8:00 AM',
  '8:15 AM',
  '8:30 AM',
  '8:45 AM',
  '9:00 AM',
  '9:15 AM',
  '9:30 AM',
  '9:45 AM',
  '10:00 AM',
  '10:15 AM',
  '10:30 AM',
  '10:45 AM',
  '11:00 AM',
  '11:15 AM',
  '11:30 AM',
  '11:45 AM',
  '12:00 PM',
  '12:15 PM',
  '12:30 PM',
  '12:45 PM',
  '1:00 PM',
  '1:15 PM',
  '1:30 PM',
  '1:45 PM',
  '2:00 PM',
  '2:15 PM',
  '2:30 PM',
  '2:45 PM',
  '3:00 PM',
  '3:15 PM',
  '3:30 PM',
  '3:45 PM',
  '4:00 PM',
  '4:15 PM',
  '4:30 PM',
  '4:45 PM',
  '5:00 PM',
  '5:15 PM',
  '5:30 PM',
  '5:45 PM',
  '6:00 PM',
  '6:15 PM',
  '6:30 PM',
  '6:45 PM',
  '7:00 PM',
  '7:15 PM',
  '7:30 PM',
  '7:45 PM',
  '8:00 PM',
  '8:15 PM',
  '8:30 PM',
  '8:45 PM',
  '9:00 PM',
  '9:15 PM',
  '9:30 PM',
  '9:45 PM',
  '10:00 PM',
  '10:15 PM',
  '10:30 PM',
  '10:45 PM',
  '11:00 PM',
  '11:15 PM',
  '11:30 PM',
  '11:45 PM',
];

interface InvoiceFormData {
  sourceType: string;
  sourceId: string;
  productName: string;
  productCategory: string;
  chatId: any;
  buyerId: any;
  supplierId: any;
  quantity: string;
  unitType: string;
  unitPrice: number;
  tradeType: string;
  incoterm: string;
  deliveryLocation: string;
  inspectionDate: string;
  inspectionTime: string;
  samplingState: string;
  samplingLGA: string;
  samplingAddress: string;
  inspectionContactName: string;
  inspectionContactPhone: string;
  inspectionContactDialCode: string;
  agreedGradePercentage: string;
}

interface InvoiceFormData {
  sourceType: string;
  sourceId: string;
  productName: string;
  productCategory: string;
  chatId: any;
  buyerId: any;
  supplierId: any;
  quantity: string;
  unitType: string;
  unitPrice: number;
  tradeType: string;
  incoterm: string;
  deliveryLocation: string;
  inspectionDate: string;
  inspectionTime: string;
  samplingState: string;
  samplingLGA: string;
  samplingAddress: string;
  inspectionContactName: string;
  inspectionContactPhone: string;
  inspectionContactDialCode: string;
  agreedGradePercentage: string;
}

interface InvoiceAgreementModalProps {
  open: boolean;
  onClose: () => void;
  thread: any;
  existingInvoice?: any;
  isEditMode?: boolean;
  onUpdateSuccess?: (data: any) => void;
}

export function InvoiceAgreementModal({
  open,
  onClose,
  thread,
  existingInvoice = null,
  isEditMode = false,
  onUpdateSuccess,
}: InvoiceAgreementModalProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [showTradeTypeInfo, setShowTradeTypeInfo] = useState(false);
  const [showIncotermsInfo, setShowIncotermsInfo] = useState(false);

  //  ADD VALIDATION ERRORS STATE
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const { user } = useSelector((state: any) => state.auth);
  const params = useParams();
  const itemId = params?.itemId as string;
  const threadType = params?.threadType as string;
  const { showAlert } = useAlert();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [isChatLoading, setIsChatLoading] = useState(false);
  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`;

  const [createInvoice, { isLoading: isCreating }] = useCreateInvoiceAgreementMutation();
  const [updateInvoice, { isLoading: isUpdating }] = useUpdateInvoiceAgreementMutation();

  // ... your existing data fetching code ...
  const { data: productData, isLoading: isLoadingProduct } = useGetAllProductDetailsQuery(
    { productId: itemId },
    { skip: !itemId || threadType !== 'product' || isEditMode }
  );

  const { data: rfqData, isLoading: isLoadingRfq } = useGetDetailFfqQuery(
    { rfqId: itemId },
    { skip: !itemId || threadType !== 'rfq' || isEditMode }
  );

  const isLoading = isLoadingProduct || isLoadingRfq;
  const itemData = threadType === 'product' ? productData?.product : rfqData?.data;

  const getBuyerAndSupplierId = () => {
    if (isEditMode && existingInvoice) {
      return {
        buyerId: existingInvoice.buyerId,
        supplierId: existingInvoice.supplierId,
      };
    }
    if (threadType === 'product') {
      const supplierId = itemData?.supplierId || thread?.supplierId;
      const buyerId = user.id === supplierId ? thread?.otherUserId : user.id;
      return { buyerId, supplierId };
    } else if (threadType === 'rfq') {
      const buyerId = itemData?.userId || thread?.buyerId;
      const supplierId = user.id === buyerId ? thread?.otherUserId : user.id;
      return { buyerId, supplierId };
    }
    return {
      buyerId: user.role === 'buyer' ? user.id : thread?.otherUserId,
      supplierId: user.role === 'supplier' ? user.id : thread?.otherUserId,
    };
  };

  const { buyerId, supplierId } = getBuyerAndSupplierId();

  // console.log('buyerId, supplierId', { buyerId, supplierId });

  // ... your existing formData state ...
  const [formData, setFormData] = useState({
    sourceType: threadType || 'product',
    sourceId: itemId || '',
    productName: '',
    productCategory: '',
    chatId: thread?.conversationId || '',
    buyerId: buyerId,
    supplierId: supplierId,
    quantity: '',
    unitType: '',
    unitPrice: 0,
    // totalPrice: '',
    // currency: 'NGN',
    tradeType: '',
    incoterm: '',
    deliveryLocation: '',
    inspectionDate: '',
    inspectionTime: '',
    samplingState: '',
    samplingLGA: '',
    samplingAddress: '',
    inspectionContactName: '',
    inspectionContactPhone: '',
    inspectionContactDialCode: '+234',
    agreedGradePercentage: '',
  });

  //  populate form with existing invoice data in edit mode
  useEffect(() => {
    if (isEditMode && existingInvoice && open) {
      setFormData({
        sourceType: existingInvoice.sourceType,
        sourceId: existingInvoice.sourceId,
        productName: existingInvoice.productName,
        productCategory: existingInvoice.productCategory,
        chatId: existingInvoice.chatId,
        buyerId: existingInvoice.buyerId,
        supplierId: existingInvoice.supplierId,
        quantity: existingInvoice.quantity.toString(),
        unitType: existingInvoice.unitType,
        unitPrice: existingInvoice.unitPrice.toString(),
        // totalPrice: existingInvoice.totalPrice.toString(),
        // currency: existingInvoice.currency,
        tradeType: existingInvoice.tradeType,
        incoterm: existingInvoice.incoterm || '',
        deliveryLocation: existingInvoice.deliveryLocation || '',
        inspectionDate: existingInvoice.inspectionDate
          ? new Date(existingInvoice.inspectionDate).toISOString().split('T')[0]
          : '',
        inspectionTime: existingInvoice.inspectionTime || '',
        samplingState: existingInvoice.samplingState,
        samplingLGA: existingInvoice.samplingLGA,
        samplingAddress: existingInvoice.samplingAddress,
        inspectionContactName: existingInvoice.inspectionContactName,
        inspectionContactPhone: existingInvoice.inspectionContactPhone,
        inspectionContactDialCode: existingInvoice.inspectionContactDialCode,
        agreedGradePercentage: existingInvoice.agreedGradePercentage.toString(),
      });
    }
  }, [isEditMode, existingInvoice, open]);

  // ... your existing useEffects ...
  useEffect(() => {
    if (itemData && open && !isEditMode) {
      setFormData((prev) => ({
        ...prev,
        productName: threadType === 'product' ? itemData.product_name : itemData.rfqProductName,
        productCategory: threadType === 'product' ? itemData.product_category : itemData.rfqProductCategory,
        quantity: threadType === 'rfq' ? itemData.quantityRequired : prev.quantity,
        unitType: threadType === 'rfq' ? itemData.quantityMeasure : prev.unitType,
        unitPrice: threadType === 'product' ? itemData.real_price : prev.unitPrice,
        deliveryLocation: threadType === 'product' ? `` : itemData.productDestination || prev.deliveryLocation,
        // samplingState: threadType === 'product' ? itemData.selected_state : prev.samplingState,
        samplingAddress: threadType === 'product' ? itemData.full_address : prev.samplingAddress,
      }));
    }
  }, [itemData, threadType, open, isEditMode]);

  useEffect(() => {
    if (formData.quantity && formData.unitPrice) {
      const total = parseFloat(formData.quantity) * formData.unitPrice;
      setFormData((prev) => ({ ...prev, totalPrice: total.toFixed(2) }));
    } else {
      setFormData((prev) => ({ ...prev, totalPrice: '0.00' }));
    }
  }, [formData.quantity, formData.unitPrice]);

  //  ENHANCED HANDLE CHANGE - Clear error when field is edited
  const handleChange = (field: string) => (event: any) => {
    const value = event.target.value as string;
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      if (field === 'tradeType' && value === 'LOCAL') {
        newData.incoterm = '';
      }
      return newData;
    });

    // Clear error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  //  VALIDATE CURRENT STEP
  const validateStep = (step: number) => {
    try {
      if (step === 0) {
        // Validate trade details
        tradeDetailsSchema.parse(formData);
      } else if (step === 1) {
        // Validate inspection details
        inspectionDetailsSchema.parse(formData);
      }
      setValidationErrors({});
      return true;
    } catch (error: any) {
      if (error) {
        const errors: Record<string, string> = {};
        error.issues.forEach((err: any) => {
          errors[err.path[0] as string] = err.message;
        });
        setValidationErrors(errors);

        // Show alert with first error
        showAlert(error.issues[0].message, 'error');
      }
      return false;
    }
  };

  //  ENHANCED HANDLE NEXT - Validate before proceeding
  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
      // Scroll to top of modal
      // We don't have a direct class query but we can scroll the modal container if needed
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    // Clear validation errors when going back
    setValidationErrors({});
  };

  // console.log('formData', formData);
  //  ENHANCED HANDLE SUBMIT - Final validation
  const handleSubmit = async () => {
    setIsChatLoading(true);
    try {
      // Validate complete form
      // completeInvoiceSchema.parse(formData);

      const payload = {
        chatId: formData.chatId,
        sourceType: formData.sourceType,
        sourceId: formData.sourceId,
        buyerId: formData.buyerId,
        supplierId: supplierId,
        productName: formData.productName,
        productCategory: formData.productCategory,
        quantity: parseFloat(formData.quantity),
        unitType: formData.unitType,
        unitPrice: Number(formData.unitPrice),
        // totalPrice: parseFloat(formData.totalPrice),
        // currency: formData.currency,
        tradeType: formData.tradeType,
        incoterm: formData.incoterm,
        inspectionContactName: formData.inspectionContactName,
        inspectionContactPhone: formData.inspectionContactPhone,
        inspectionContactDialCode: formData.inspectionContactDialCode,
        // inspectionDate: formData.inspectionDate,
        // inspectionTime: formData.inspectionTime,
        agreedGradePercentage: formData.agreedGradePercentage,
        samplingState: formData.samplingState,
        samplingLGA: formData.samplingLGA,
        samplingAddress: formData.samplingAddress,
      } as any;
      let result;

      // const result = await createInvoice(payload).unwrap();

      // if (result?.data) {
      //   await sendInvoiceMessage(
      //     thread.conversationId,
      //     user.id,
      //     fullName || user.businessName,
      //     user.businessName,
      //     result.data
      //   );
      // }

      if (isEditMode) {
        // UPDATE existing invoice
        result = await updateInvoice({
          userId: existingInvoice.id,
          ...payload,
        }).unwrap();

        showAlert('Trade agreement updated successfully!', 'success');

        // Update chat message if needed
        if (result?.data && formData.chatId) {
          await sendInvoiceMessage(
            formData.chatId,
            user.id,
            fullName || user.businessName,
            user.businessName,
            result.data
            // true // isUpdate flag
          );
        }

        // Call success callback
        if (onUpdateSuccess) {
          onUpdateSuccess(result.data);
        }
      } else {
        // CREATE new invoice
        result = await createInvoice(payload).unwrap();

        if (result?.data) {
          await sendInvoiceMessage(
            thread.conversationId,
            user.id,
            fullName || user.businessName,
            user.businessName,
            result.data
          );
        }

        showAlert('Trade agreement created successfully!', 'success');
      }

      setIsChatLoading(false);
      onClose();
      // Reset form and errors
      setActiveStep(0);
      setValidationErrors({});
    } catch (err: any) {
      setIsChatLoading(false);
      if (err.errors) {
        // Zod validation errors
        const errors: Record<string, string> = {};
        err.errors.forEach((error: any) => {
          errors[error.path[0] as string] = error.message;
        });
        setValidationErrors(errors);
        showAlert('Please fill all required fields correctly', 'error');
      } else {
        // API errors
        console.error('Failed to create invoice:', err);
        showAlert(`Failed to ${isEditMode ? 'update' : 'create'} agreement. Please try again.`, 'error');
      }
    }
  };

  //  HELPER TO GET ERROR MESSAGE
  const getErrorMessage = (field: string) => {
    return validationErrors[field];
  };

  //  HELPER TO CHECK IF FIELD HAS ERROR
  const hasError = (field: string) => {
    return !!validationErrors[field];
  };

  const handleClose = () => {
    onClose();
    setActiveStep(0);
    setValidationErrors({});
    // Only reset form data if NOT in edit mode
    if (!isEditMode) {
      setFormData({
        sourceType: threadType || 'product',
        sourceId: itemId || '',
        productName: '',
        productCategory: '',
        chatId: thread?.conversationId || '',
        buyerId: buyerId,
        supplierId: supplierId,
        quantity: '',
        unitType: '',
        unitPrice: 0,
        tradeType: '',
        incoterm: '',
        deliveryLocation: '',
        inspectionDate: '',
        inspectionTime: '',
        samplingState: '',
        samplingLGA: '',
        samplingAddress: '',
        inspectionContactName: '',
        inspectionContactPhone: '',
        inspectionContactDialCode: '+234',
        agreedGradePercentage: '',
      });
    }
  };

  const renderCurrencySymbol = (currency: string) => {
    if (isEditMode && existingInvoice) {
      currency = existingInvoice.currency;
    }
    return currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : '₦';
  };
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box className="flex flex-col gap-3">
            <Alert severity="info" icon={<InfoIcon />}>
              <AlertTitle>Pre-filled Information</AlertTitle>
              Details are automatically filled from your {threadType === 'product' ? 'product' : 'RFQ'}.
            </Alert>

            <Box className="bg-gray-50 p-4 rounded-md">
              <Typography variant="subtitle2" gutterBottom>
                {threadType === 'product' ? 'Product' : 'RFQ'} Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label={threadType === 'product' ? 'Product Name' : 'RFQ Product Name'}
                    value={formData.productName}
                    fullWidth
                    disabled
                    error={hasError('productName')}
                    helperText={getErrorMessage('productName')}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Category"
                    value={formData.productCategory}
                    fullWidth
                    disabled
                    error={hasError('productCategory')}
                    helperText={getErrorMessage('productCategory')}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Source Type"
                    value={formData.sourceType.toUpperCase()}
                    fullWidth
                    disabled
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            <Typography variant="h6">Quantity & Pricing</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Quantity *"
                  type="number"
                  value={formData.quantity}
                  onChange={handleChange('quantity')}
                  fullWidth
                  required
                  error={hasError('quantity')}
                  helperText={getErrorMessage('quantity') || 'Total quantity for this trade'}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth error={hasError('unitType')}>
                  <FormLabel>Unit Type *</FormLabel>
                  <Select
                    value={formData.unitType}
                    onChange={handleChange('unitType')}
                    MenuProps={{
                      PaperProps: {
                        style: { maxHeight: 250 },
                      },
                    }}
                  >
                    <MenuItem value="">Select Unit type</MenuItem>
                    {Moq.map((unit, i) => (
                      <MenuItem key={i} value={unit}>
                        {unit}
                      </MenuItem>
                    ))}
                  </Select>
                  {hasError('unitType') && <FormHelperText>{getErrorMessage('unitType')}</FormHelperText>}
                </FormControl>
              </Grid>

              {/* <Grid item xs={12} md={4}>
                <TextField
                  label="Unit Price *"
                  type="number"
                  value={formData.unitPrice}
                  onChange={handleChange('unitPrice')}
                  fullWidth
                  disabled={threadType === 'product'}
                  required
                  error={hasError('unitPrice')}
                  helperText={getErrorMessage('unitPrice')}
                  InputProps={{
                    startAdornment: (
                      <Typography className="mr-2">
                        {itemData?.unitCurrency === 'NGN' ? '₦' : itemData?.unitCurrency === 'USD' ? '$' : '₦'}
                        {renderCurrencySymbol(formData.currency)}
                      </Typography>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Total Price"
                  value={formData.totalPrice}
                  fullWidth
                  disabled
                  InputProps={{
                    startAdornment: (
                      <Typography className="mr-2">
                        {itemData?.unitCurrency === 'NGN' ? '₦' : itemData?.unitCurrency === 'USD' ? '$' : '₦'}
                        {renderCurrencySymbol(formData.currency)}
                      </Typography>
                    ),
                  }}
                  helperText="Automatically calculated"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={hasError('currency')}>
                  <TextField
                    select
                    label="Currency *"
                    value={formData.currency}
                    onChange={handleChange('currency')}
                    error={hasError('currency')}
                    helperText={getErrorMessage('currency')}
                  >
                    <option value="NGN">NGN (₦)</option>
                    <option value="USD">USD ($)</option>
                  </TextField>
                </FormControl>
              </Grid> */}
            </Grid>

            <Divider />

            <Box>
              <Box className="flex items-center gap-2 mb-2">
                <Typography variant="h6">Trade Type *</Typography>
                <IconButton aria-label="info" size="sm" onClick={() => setShowTradeTypeInfo(!showTradeTypeInfo)}>
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Box>

              <Collapse in={showTradeTypeInfo}>
                <Alert severity="info" className="mb-4">
                  <AlertTitle>Trade Type Information</AlertTitle>
                  <Typography variant="body2" paragraph>
                    <strong>LOCAL TRADE:</strong> For transactions within Nigeria. Does not require international
                    shipping terms (Incoterms).
                  </Typography>
                  <Typography variant="body2">
                    <strong>INTERNATIONAL TRADE:</strong> For cross-border transactions. Requires Incoterms (FOB, CIF,
                    etc.) to define shipping responsibilities and costs.
                  </Typography>
                  <Link
                    href="https://www.trade.gov/know-your-incoterms"
                    target="_blank"
                    rel="noopener"
                    className="mt-1 block"
                  >
                    Learn more about Incoterms →
                  </Link>
                </Alert>
              </Collapse>

              <FormControl component="fieldset" required error={hasError('tradeType')}>
                <RadioGroup name="tradeType" value={formData.tradeType} onChange={handleChange('tradeType')} row>
                  <FormControlLabel value="LOCAL" control={<Radio />} label="Local Trade (Within Nigeria)" />
                  <FormControlLabel value="INTERNATIONAL" control={<Radio />} label="International Trade" />
                </RadioGroup>
                {hasError('tradeType') && <FormHelperText>{getErrorMessage('tradeType')}</FormHelperText>}
              </FormControl>
            </Box>

            {formData.tradeType === 'INTERNATIONAL' && (
              <Box>
                <Box className="flex items-center gap-2 mb-2">
                  <Typography variant="subtitle1">Incoterms *</Typography>
                  <IconButton aria-label="info" size="sm" onClick={() => setShowIncotermsInfo(!showIncotermsInfo)}>
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Box>

                <Alert severity="warning" className="mb-4">
                  <AlertTitle>Important Notice</AlertTitle>
                  <Typography variant="body2" paragraph>
                    <strong>FOB (Free On Board):</strong> Buyer is responsible for shipping costs and risks after goods
                    are loaded. MIMEI recommends having your representative present.
                  </Typography>
                  <Typography variant="body2">
                    <strong>CIF (Cost, Insurance, Freight):</strong> Seller pays for shipping and insurance. MIMEI is
                    not liable for any issues during transit after inspection approval.
                  </Typography>
                  <Link
                    href="https://www.trade.gov/know-your-incoterms"
                    target="_blank"
                    rel="noopener"
                    className="mt-1 block"
                  >
                    Learn more about Incoterms →
                  </Link>
                </Alert>

                <FormControl fullWidth error={hasError('incoterm')}>
                  <TextField
                    error={hasError('incoterm')}
                    helperText={getErrorMessage('incoterm')}
                  >
                    <option value="">Select...</option>
                    <option value="FOB">FOB - Free On Board</option>
                    <option value="CIF">CIF - Cost, Insurance, Freight</option>
                    <option value="EXW">EXW - Ex Works</option>
                    <option value="FCA">FCA - Free Carrier</option>
                    <option value="DAP">DAP - Delivered At Place</option>
                  </TextField>
                </FormControl>
              </Box>
            )}

            {threadType !== 'product' && (
              <TextField
                label="Delivery Location"
                value={formData.deliveryLocation}
                onChange={handleChange('deliveryLocation')}
                fullWidth
                multiline
                rows={2}
                placeholder="Full delivery address or port details"
                error={hasError('deliveryLocation')}
                helperText={getErrorMessage('deliveryLocation')}
              />
            )}
          </Box>
        );

      case 1:
        return (
          <Box className="flex flex-col gap-3">
            <Alert severity="info">
              <AlertTitle>Inspection Process</AlertTitle>
              Minmeg will assign a verified inspection company to validate the minerals at the supplier's location.
            </Alert>

            {/* <Typography variant="h6">Inspection Window</Typography> */}
            {/* <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Inspection Date *"
                  type="date"
                  value={formData.inspectionDate}
                  onChange={handleChange('inspectionDate')}
                  fullWidth
                  required
                  error={hasError('inspectionDate')}
                  helperText={getErrorMessage('inspectionDate')}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    min: new Date().toISOString().split('T')[0], // Prevent past dates
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={hasError('inspectionTime')}>
                  <FormLabel>Inspection Time *</FormLabel>
                  <Select
                    value={formData.inspectionTime}
                    onChange={handleChange('inspectionTime')}
                    MenuProps={{
                      PaperProps: {
                        style: { maxHeight: 250 },
                      },
                    }}
                  >
                    <MenuItem value="">Select Time</MenuItem>
                    {timeSlots.map((time, i) => (
                      <MenuItem key={i} value={time}>
                        {time}
                      </MenuItem>
                    ))}
                  </Select>
                  {hasError('inspectionTime') && <FormHelperText>{getErrorMessage('inspectionTime')}</FormHelperText>}
                </FormControl>
              </Grid>
            </Grid> */}

            <Divider />

            <Typography variant="h6">Sampling Location</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={hasError('samplingState')}>
                  <FormLabel>State *</FormLabel>
                  <Select
                    value={formData.samplingState}
                    onChange={handleChange('samplingState')}
                    MenuProps={{
                      PaperProps: {
                        style: { maxHeight: 250 },
                      },
                    }}
                  >
                    <MenuItem value="">Select State</MenuItem>
                    {nigeriaStates.map((state, i) => (
                      <MenuItem key={i} value={state.value}>
                        {state.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {hasError('samplingState') && <FormHelperText>{getErrorMessage('samplingState')}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={hasError('samplingLGA')}>
                  <FormLabel>LGA *</FormLabel>
                  <Select
                    value={formData.samplingLGA}
                    onChange={handleChange('samplingLGA')}
                    disabled={!formData.samplingState}
                    MenuProps={{
                      PaperProps: {
                        style: { maxHeight: 250 },
                      },
                    }}
                  >
                    <MenuItem value="">Select LGA</MenuItem>
                    {(nigeriaLgas as any)[formData.samplingState]?.map((lga: any, i: number) => (
                      <MenuItem key={i} value={lga.value}>
                        {lga.label}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {hasError('samplingLGA') ? getErrorMessage('samplingLGA') : 'Select state first'}
                  </FormHelperText>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Detailed Address *"
                  value={formData.samplingAddress}
                  onChange={handleChange('samplingAddress')}
                  fullWidth
                  required
                  multiline
                  rows={2}
                  placeholder="Provide detailed address for the inspection team"
                  error={hasError('samplingAddress')}
                  helperText={getErrorMessage('samplingAddress')}
                />
              </Grid>
            </Grid>

            <Divider />

            <Typography variant="h6">On-Site Inspection Contact</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Inspection Contact Name *"
                  value={formData.inspectionContactName}
                  onChange={handleChange('inspectionContactName')}
                  fullWidth
                  required
                  error={hasError('inspectionContactName')}
                  helperText={getErrorMessage('inspectionContactName')}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Dial Code"
                  value={formData.inspectionContactDialCode}
                  onChange={handleChange('inspectionContactDialCode')}
                  fullWidth
                  disabled
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Phone *"
                  value={formData.inspectionContactPhone}
                  onChange={handleChange('inspectionContactPhone')}
                  fullWidth
                  required
                  error={hasError('inspectionContactPhone')}
                  helperText={getErrorMessage('inspectionContactPhone')}
                  placeholder="8012345678"
                />
              </Grid>
            </Grid>

            <Divider />

            <Box>
              <Typography variant="h6" gutterBottom>
                Agreed Grade Percentage *
              </Typography>
              <TextField
                label="Minimum Grade Percentage"
                type="number"
                value={formData.agreedGradePercentage}
                onChange={handleChange('agreedGradePercentage')}
                fullWidth
                required
                error={hasError('agreedGradePercentage')}
                helperText={
                  getErrorMessage('agreedGradePercentage') || 'The minimum acceptable quality grade percentage (0-100%)'
                }
              />
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box className="flex flex-col gap-3">
            <Alert severity="warning">
              <AlertTitle>Review Before Submission</AlertTitle>
              This agreement will be sent to the other party for approval before submission to Minmeg.
            </Alert>

            <Box className="bg-gray-50 p-4 rounded-md">
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Trade Summary
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body2">Product:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" fontWeight="medium">
                    {formData.productName}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2">Quantity:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" fontWeight="medium">
                    {formData.quantity} {formData.unitType}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2">Unit Price:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" fontWeight="medium">
                    {itemData.unitCurrency === 'NGN' ? '₦' : itemData.unitCurrency === 'USD' ? '$' : '₦'}
                    {/* {renderCurrencySymbol(formData.currency) || } */}
                    {formData.unitPrice}
                  </Typography>
                </Grid>

                {/* <Grid item xs={6}>
                  <Typography variant="body2">Total Price:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" fontWeight="medium">
                    {itemData.unitCurrency === 'NGN' ? '₦' : itemData.unitCurrency === 'USD' ? '$' : '₦'}
                    {renderCurrencySymbol(formData.currency)}
                    {formData.totalPrice}
                  </Typography>
                </Grid> */}

                <Grid item xs={6}>
                  <Typography variant="body2">Trade Type:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" fontWeight="medium">
                    {formData.tradeType}
                  </Typography>
                </Grid>

                {formData.incoterm && (
                  <>
                    <Grid item xs={6}>
                      <Typography variant="body2">Incoterm:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" fontWeight="medium">
                        {formData.incoterm}
                      </Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </Box>

            <Box className="bg-gray-50 p-4 rounded-md">
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Inspection Details
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body2">Location:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" fontWeight="medium">
                    {formData.samplingState}, {formData.samplingLGA}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2">Location (address):</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" fontWeight="medium">
                    {formData.samplingAddress}
                  </Typography>
                </Grid>

                {/* <Grid item xs={6}>
                  <Typography variant="body2">Inspection Date:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" fontWeight="medium">
                    {formData.inspectionDate}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2">Inspection Time:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" fontWeight="medium">
                    {formData.inspectionTime}
                  </Typography>
                </Grid> */}

                <Grid item xs={6}>
                  <Typography variant="body2">Grade Required:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" fontWeight="medium">
                    {formData.agreedGradePercentage}%
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            {/* for  inspection person */}
            <Box className="bg-gray-50 p-4 rounded-md">
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Inspection Contact
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body2">Name:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" fontWeight="medium">
                    {formData.inspectionContactName}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2">Phone:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" fontWeight="medium">
                    {formData.inspectionContactDialCode} {formData.inspectionContactPhone}
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            <Alert severity="info">
              <Typography variant="body2">By submitting this agreement, both parties acknowledge that:</Typography>
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>
                  <Typography variant="body2">All information provided is accurate</Typography>
                </li>
                <li>
                  <Typography variant="body2">Both parties agree to the terms</Typography>
                </li>
                <li>
                  <Typography variant="body2">Minmeg will assign an inspector after approvals</Typography>
                </li>
                <li>
                  <Typography variant="body2">Trade is subject to successful inspection</Typography>
                </li>
              </ul>
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  // ... rest of your component remains the same ...

  if (isLoading) {
    return (
      <Dialog open={open} onClose={handleClose}>
        <DialogContent>
          <Box className="flex justify-center p-8">
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      className="min-h-[70vh]"
    >
      <DialogTitle>
        <Box className="flex justify-between items-center w-full">
          <Typography className="text-[0.85rem] sm:text-[1.25rem]">
            {isEditMode ? 'Update ' : 'Create'}
            Trade Agreement with{' '}
            <b>
              {' '}
              {`${thread?.currentOtherUserName} - (${thread?.currentOtherUserCompanyName})` || 'Counterparty'}
            </b> for <b> {thread.itemTitle}</b>
          </Typography>
          <IconButton
            aria-label="Close"
            onClick={onClose}
            size="sm"
            className="bg-gray-200 hover:bg-gray-300 p-2 rounded-full ml-2"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Stepper activeStep={activeStep} orientation={isMobile ? 'vertical' : 'horizontal'} className="mb-8">
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent(activeStep)}
      </DialogContent>

      <DialogActions className="p-4 gap-2 border-t">
        <Button onClick={handleClose} disabled={isCreating || isUpdating || isChatLoading}>
          Cancel
        </Button>
        <Box className="flex-auto" />
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={isCreating || isUpdating || isChatLoading}>
            Back
          </Button>
        )}
        {activeStep < steps.length - 1 ? (
          <Button variant="contained" onClick={handleNext}>
            Next
          </Button>
        ) : (
          <Button variant="contained" onClick={handleSubmit} disabled={isCreating || isUpdating || isChatLoading}>
            {isCreating || isUpdating || isChatLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : isEditMode ? (
              'Update & Resubmit Agreement'
            ) : (
              'Submit Agreement'
            )}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

// Step 1: Trade Details Validation
export const tradeDetailsSchema = z
  .object({
    productName: z.string().min(1, 'Product name is required'),
    productCategory: z.string().min(1, 'Product category is required'),
    quantity: z
      .string()
      .min(1, 'Quantity is required')
      .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
        message: 'Quantity must be greater than 0',
      }),
    unitType: z.string().min(1, 'Unit type is required'),
    // unitPrice: z
    //   .string()
    //   .min(1, 'Unit price is required')
    //   .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    //     message: 'Unit price must be greater than 0',
    //   }),
    // totalPrice: z.string().optional(),
    // currency: z.enum(['NGN', 'USD'], {
    //   errorMap: () => ({ message: 'Please select a currency' }),
    // }),
    tradeType: z.string().refine((val) => ['LOCAL', 'INTERNATIONAL'].includes(val), {
      message: 'Please select a trade type',
    }),
    incoterm: z.string().optional(),
    deliveryLocation: z.string().optional(),
  })
  .refine(
    (data) => {
      // If INTERNATIONAL trade, incoterm is required
      if (data.tradeType === 'INTERNATIONAL') {
        return data.incoterm && data.incoterm.length > 0;
      }
      return true;
    },
    {
      message: 'Incoterm is required for international trade',
      path: ['incoterm'],
    }
  );

// Step 2: Inspection Details Validation
export const inspectionDetailsSchema = z.object({
  // inspectionDate: z
  //   .string()
  //   .min(1, 'Inspection date is required')
  //   .refine(
  //     (date) => {
  //       const selectedDate = new Date(date);
  //       const today = new Date();
  //       today.setHours(0, 0, 0, 0);
  //       return selectedDate >= today;
  //     },
  //     {
  //       message: 'Inspection date cannot be in the past',
  //     }
  //   ),
  // inspectionTime: z.string().min(1, 'Inspection time is required'),
  samplingState: z.string().min(1, 'State is required'),
  samplingLGA: z.string().min(1, 'LGA is required'),
  samplingAddress: z.string().min(10, 'Please provide a detailed address (minimum 10 characters)'),
  inspectionContactName: z.string().min(2, 'Contact name is required'),
  inspectionContactPhone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(11, 'Phone number must not exceed 11 digits')
    .refine((phone) => /^\d+$/.test(phone), {
      message: 'Phone number must contain only digits',
    }),
  inspectionContactDialCode: z.string().min(1, 'Dial code is required'),
  agreedGradePercentage: z
    .string()
    .min(1, 'Grade percentage is required')
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0 && num <= 100;
      },
      {
        message: 'Grade percentage must be between 0 and 100',
      }
    ),
});

// Complete validation schema (for final submission)
// export const completeInvoiceSchema = tradeDetailsSchema.and(inspectionDetailsSchema).and({
//   sourceType: z.string(),
//   sourceId: z.string(),
//   chatId: z.string(),
//   buyerId: z.string(),
//   supplierId: z.string(),
// });
