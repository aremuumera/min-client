'use client';

import React, { useState } from 'react';
import { useSubmitEnquiryFormMutation } from '@/redux/features/enquiry/enquiry_api';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, CheckCircle, X } from 'lucide-react';

import { toast } from '@/components/core/toaster';

interface EnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  [key: string]: string;
  fullName: string;
  email: string;
  company_name: string;
  phone_number: string;
  message: string;
  userType: string;
}

export const EnquiryModal: React.FC<EnquiryModalProps> = ({ isOpen, onClose }) => {
  const [submitEnquiryForm, { isLoading: isSubmitting }] = useSubmitEnquiryFormMutation();

  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    company_name: '',
    phone_number: '',
    message: '',
    userType: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    onClose();
  };

  const CAL_LINK = 'https://cal.com/minmeg/30min';

  const userTypes = [
    {
      value: 'mining_company',
      label: 'Mining Companies - Exploration, extraction, production, processing, trading',
    },
    {
      value: 'supplier',
      label: 'Suppliers - Equipment manufacturers / tech providers, gemstone dealers, artisan miners, miners',
    },
    {
      value: 'service_provider',
      label: 'Service Providers - Independent laboratories, Maintenance, consulting, logistics',
    },
    {
      value: 'buyer',
      label: 'Buyers - Corporations, wholesalers, retailers, marketers, traders',
    },
    {
      value: 'investor',
      label: 'Investors - Looking for mining opportunities',
    },
    {
      value: 'job_seeker',
      label: 'Job Seekers - Mining professionals',
    },
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName || formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.userType) {
      newErrors.userType = 'Please select what type of user you are';
    }

    if (!formData.company_name || formData.company_name.trim().length < 2) {
      newErrors.company_name = 'Company name must be at least 2 characters';
    }

    if (!formData.phone_number || formData.phone_number.trim().length < 8) {
      newErrors.phone_number = 'Phone number must be at least 8 digits';
    }

    if (!formData.message || formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fill in all required fields correctly', {
        duration: 4000,
        position: 'top-center',
      });
      return;
    }

    try {
      // Map form data to match backend expectations
      const payload = {
        full_name: formData.fullName,
        email: formData.email,
        phone_number: formData.phone_number,
        company_name: formData.company_name,
        description: formData.message,
        enquiry_type: 'new_enquiry',
        enquiry_category: formData.userType,
        priority: 'medium',
        source: 'website',
        tags: [],
      };

      console.log('Submitting payload:', payload);

      const response = await submitEnquiryForm(payload).unwrap();

      console.log('Response:', response);

      // Show success message
      toast.success('Enquiry submitted successfully! We will get back to you soon.', {
        duration: 4000,
        position: 'top-center',
      });

      // Reset form
      setFormData({
        fullName: '',
        email: '',
        company_name: '',
        phone_number: '',
        message: '',
        userType: '',
      });
      setErrors({});

      // Show success modal
      setShowSuccessModal(true);

      // Close modal after successful submission
      // setTimeout(() => onClose(), 1000);
    } catch (error: any) {
      console.error('Error submitting enquiry:', error);

      // Show error message
      const errorMessage =
        error?.data?.message ||
        (error?.data?.errors && Array.isArray(error.data.errors) ? error.data.errors[0] : null) ||
        'Failed to submit enquiry. Please try again.';
      toast.error(errorMessage, {
        duration: 4000,
        position: 'top-center',
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: FormData) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev: Record<string, string>) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectUserType = (type: string) => {
    setFormData((prev) => ({ ...prev, userType: type }));
    setIsDropdownOpen(false);
    // Clear error when user selects
    if (errors.userType) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.userType;
        return newErrors;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 px-1 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3 }}
              className="relative w-full max-w-5xl my-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                type="button"
                className="absolute -top-4 sm:-right-4 -right-1 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6 text-gray-700" />
              </button>

              {/* Modal Content */}
              <div className="bg-[#001A00] rounded-[40px] text-white flex flex-col md:flex-row items-start justify-center gap-4 sm:gap-10 p-3 sm:p-10">
                {/* Left Section */}
                <motion.div
                  className="max-w-md space-y-6 sm:block hidden"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <div
                    className="inline-flex items-center justify-center w-fit rounded-2xl p-3"
                    style={{
                      background: 'linear-gradient(to bottom, #13592D4D, #061E1D2E, #2A952A66)',
                    }}
                  >
                    <div className="w-[40px] h-[40px] bg-green-600 rounded-full flex items-center justify-center transform rotate-12">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M12 2L2 7L12 12L22 7L12 2Z"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M2 17L12 22L22 17"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M2 12L12 17L22 12"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>

                  <h2 className="text-4xl md:text-5xl font-bold leading-tight"> Get Started with Minmeg</h2>
                  <p className="text-gray-300 text-lg">Complete the form below and let's get you set up.</p>
                </motion.div>

                <motion.div
                  className="max-w-md pt-4 sm:hidden"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <p className="text-lg md:text-5xl px-2 text-center font-bold leading-tight">
                    Complete the form below and let's get you set up.
                  </p>
                </motion.div>

                {/* Right Section - Form */}
                <motion.form
                  onSubmit={handleSubmit}
                  className="bg-[#002B00] sm:p-6 p-4 rounded-2xl w-full max-w-xl shadow-lg space-y-3"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <div>
                    <label htmlFor="fullName" className="block mb-2 text-sm font-medium">
                      Full Name
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full p-3 rounded-lg bg-black/30 border border-gray-600 text-white placeholder-gray-500 focus:border-green-500 focus:outline-none transition-colors"
                      placeholder="Enter your fullname"
                    />
                    {errors.fullName && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-sm mt-1"
                      >
                        {errors.fullName}
                      </motion.p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="company_name" className="block mb-2 text-sm font-medium">
                      Company Name
                    </label>
                    <input
                      id="company_name"
                      type="text"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleChange}
                      className="w-full p-3 rounded-lg bg-black/30 border border-gray-600 text-white placeholder-gray-500 focus:border-green-500 focus:outline-none transition-colors"
                      placeholder="Enter your company name"
                    />
                    {errors.company_name && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-sm mt-1"
                      >
                        {errors.company_name}
                      </motion.p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block mb-2 text-sm font-medium">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full p-3 rounded-lg bg-black/30 border border-gray-600 text-white placeholder-gray-500 focus:border-green-500 focus:outline-none transition-colors"
                      placeholder="Enter your email address"
                    />
                    {errors.email && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-sm mt-1"
                      >
                        {errors.email}
                      </motion.p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phone_number" className="block mb-2 text-sm font-medium">
                      Phone Number
                    </label>
                    <input
                      id="phone_number"
                      type="tel"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleChange}
                      className="w-full p-3 rounded-lg bg-black/30 border border-gray-600 text-white placeholder-gray-500 focus:border-green-500 focus:outline-none transition-colors"
                      placeholder="Enter your phone number"
                    />
                    {errors.phone_number && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-sm mt-1"
                      >
                        {errors.phone_number}
                      </motion.p>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block mb-2 text-sm font-medium">Enquiry Type</label>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsDropdownOpen(!isDropdownOpen);
                      }}
                      className="w-full p-3 rounded-lg bg-black/30 border border-gray-600 text-white cursor-pointer flex items-center justify-between focus:border-green-500 transition-colors"
                    >
                      <span className={formData.userType ? 'text-white' : 'text-gray-500'}>
                        {formData.userType
                          ? userTypes.find((t) => t.value === formData.userType)?.label
                          : 'Select your type'}
                      </span>
                      <motion.svg
                        animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </motion.svg>
                    </div>

                    <AnimatePresence>
                      {isDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute z-50 w-full mt-2 bg-[#002B00] border border-gray-600 rounded-lg shadow-xl overflow-hidden"
                        >
                          <div className="max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-green-600 scrollbar-track-gray-800">
                            {userTypes.map((type, index) => (
                              <motion.div
                                key={type.value}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.03 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectUserType(type.value);
                                }}
                                className={`p-3 cursor-pointer transition-colors ${
                                  formData.userType === type.value
                                    ? 'bg-green-600 text-white'
                                    : 'hover:bg-green-600/20 text-gray-300'
                                }`}
                              >
                                {type.label}
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {errors.userType && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-sm mt-1"
                      >
                        {errors.userType}
                      </motion.p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="message" className="block mb-2 text-sm font-medium">
                      Message
                    </label>
                    <textarea
                      id="message"
                      rows={4}
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full p-3 rounded-lg bg-black/30 border border-gray-600 text-white placeholder-gray-500 focus:border-green-500 focus:outline-none transition-colors resize-none"
                      placeholder="Enter your message"
                    />
                    {errors.message && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-sm mt-1"
                      >
                        {errors.message}
                      </motion.p>
                    )}
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                    whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Sending...
                      </>
                    ) : (
                      'Submit Enquiry'
                    )}
                  </motion.button>
                </motion.form>
              </div>
            </motion.div>
          </motion.div>
        </>
      </AnimatePresence>

      <SuccessModal isOpen={showSuccessModal} onClose={handleCloseSuccessModal} calLink={CAL_LINK} />
    </>
  );
};

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  calLink?: string;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, calLink }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        />

        {/* Modal Container with Scroll */}
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center sm:p-4 p-1">
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3 }}
              className="relative w-full max-w-6xl my-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                type="button"
                className="absolute -top-4 sm:-right-4 -right-1 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6 text-gray-700" />
              </button>

              {/* Modal Content */}
              <div className="bg-[#001A00] rounded-[40px] text-white p-6 sm:p-10">
                {/* Success Header */}
                <motion.div
                  className="text-center mb-8"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.div
                    className="inline-flex items-center justify-center mb-4"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                  >
                    <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-12 h-12 text-white" />
                    </div>
                  </motion.div>

                  <h2 className="text-3xl md:text-4xl font-bold mb-3">Enquiry Submitted Successfully!</h2>
                  <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                    Thank you for your interest in Minmeg. We've received your enquiry and are excited to connect with
                    you.
                  </p>
                </motion.div>

                {/* Call to Action */}
                <motion.div
                  className="bg-[#002B00] rounded-2xl p-6 mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Schedule a Call with Our Team</h3>
                      <p className="text-gray-300 text-sm">
                        Take the next step and book a call with our Business Development team and Founder. Let's discuss
                        how Minmeg can help transform your mining operations.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Cal.com Embed - Now with proper height */}
                <motion.div
                  className=" rounded-2xl overflow-hidden w-full"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="w-full" style={{ height: '700px' }}>
                    <iframe
                      src={calLink || 'https://cal.com/your-cal-link'}
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      title="Schedule a call"
                      className="rounded-2xl"
                      style={{ border: 'none' }}
                    />
                  </div>
                </motion.div>

                {/* Footer Note */}
                <motion.p
                  className="text-center text-gray-400 text-sm mt-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  Can't find a suitable time? We'll reach out to you via email shortly.
                </motion.p>
              </div>
            </motion.div>
          </div>
        </div>
      </>
    </AnimatePresence>
  );
};
