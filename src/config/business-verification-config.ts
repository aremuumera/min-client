/**
 * Business Verification Configuration & Internationalization Utilities
 * Handles B2B entity types, dynamic document labels, and country-specific compliance requirements (Nigeria vs International).
 */

export interface BusinessTypeOption {
  value: string;
  label: string;
  category: 'company' | 'business' | 'non_profit' | 'government';
  requiresDirectors: boolean;
  description: string;
}

export const BUSINESS_TYPES: BusinessTypeOption[] = [
  {
    value: 'llc',
    label: 'Limited Liability Company (LLC)',
    category: 'company',
    requiresDirectors: true,
    description: 'Private company limited by shares or member liability.',
  },
  {
    value: 'registered_company',
    label: 'Private Limited Company (Ltd / Corp)',
    category: 'company',
    requiresDirectors: true,
    description: 'Standard incorporated entity with limited liability.',
  },
  {
    value: 'public_company',
    label: 'Public Limited Company (PLC)',
    category: 'company',
    requiresDirectors: true,
    description: 'Publicly listed or traded commercial corporation.',
  },
  {
    value: 'sole_proprietorship',
    label: 'Sole Proprietorship / Registered Business Name',
    category: 'business',
    requiresDirectors: false,
    description: 'Unincorporated business owned and operated by one individual.',
  },
  {
    value: 'partnership',
    label: 'General or Limited Partnership (LLP)',
    category: 'company',
    requiresDirectors: true,
    description: 'Commercial entity owned by two or more partners.',
  },
  {
    value: 'corporation',
    label: 'Corporation (Inc. / C-Corp / S-Corp)',
    category: 'company',
    requiresDirectors: true,
    description: 'Formal corporate structure with board of directors.',
  },
  {
    value: 'trust',
    label: 'Business Trust',
    category: 'company',
    requiresDirectors: true,
    description: 'Legal arrangement managed by appointed trustees.',
  },
  {
    value: 'non_profit',
    label: 'Non-Profit Organization / NGO / Charity',
    category: 'non_profit',
    requiresDirectors: true,
    description: 'Incorporated non-profit, foundation, or charity organization.',
  },
  {
    value: 'public_agency',
    label: 'Public Agency / State-Owned Entity',
    category: 'government',
    requiresDirectors: true,
    description: 'Government agency, statutory body, or state enterprise.',
  },
  {
    value: 'private_foundation',
    label: 'Private Foundation',
    category: 'non_profit',
    requiresDirectors: true,
    description: 'Philanthropic entity established by family or corporation.',
  },
];

export interface CountryVerificationConfig {
  isNigeria: boolean;
  registrationNumberLabel: string;
  registrationNumberPlaceholder: string;
  cacCertificateLabel: string;
  cacCertificateHelpText: string;
  incorporationCertLabel: string;
  incorporationCertHelpText: string;
  memartLabel: string;
  memartHelpText: string;
  directorsDocumentLabel: string;
  directorsDocumentHelpText: string;
  taxIdLabel: string;
  taxIdPlaceholder: string;
  taxClearanceLabel: string;
  taxClearanceHelpText: string;
  directorIdTypes: Array<{ value: string; label: string }>;
}

export function getCountryVerificationConfig(countryCode?: string): CountryVerificationConfig {
  const isNigeria = (countryCode || '').toUpperCase() === 'NG';

  if (isNigeria) {
    return {
      isNigeria: true,
      registrationNumberLabel: 'CAC Registration Number (RC / BN)',
      registrationNumberPlaceholder: 'e.g. RC1234567 or BN9876543',
      cacCertificateLabel: 'CAC Certificate / Business Registration',
      cacCertificateHelpText: 'Official Certificate of Registration issued by Corporate Affairs Commission (CAC).',
      incorporationCertLabel: 'Certificate of Incorporation',
      incorporationCertHelpText: 'Certified True Copy (CTC) of CAC Certificate of Incorporation.',
      memartLabel: 'Memorandum & Articles of Association (MEMART)',
      memartHelpText: 'Stamped copy of corporate MEMART detailing object clauses & share structure.',
      directorsDocumentLabel: 'Status Report / Form CAC 1.1 / Form CO7',
      directorsDocumentHelpText: 'CAC Status Report or Form CO7 listing current registered directors & shareholders.',
      taxIdLabel: 'Tax Identification Number (TIN)',
      taxIdPlaceholder: 'e.g. 12345678-0001 ',
      taxClearanceLabel: 'Tax Clearance Certificate (TCC)',
      taxClearanceHelpText: 'Current Tax Clearance Certificate or FIRS Tax Compliance Evidence.',
      directorIdTypes: [
        { value: 'national_id', label: 'NIN (National Identification Number)' },
        { value: 'bvn', label: 'Bank Verification Number (BVN)' },
        { value: 'passport', label: 'International Passport' },
        { value: 'drivers_license', label: "Driver's License" },
        { value: 'voters_card', label: "Voter's Card" },
      ],
    };
  }

  return {
    isNigeria: false,
    registrationNumberLabel: 'Company Registration Number (CRN) / Business ID',
    registrationNumberPlaceholder: 'e.g. 12345678 or State/Federal Business Registry ID',
    cacCertificateLabel: 'Business Registration / Incorporation Certificate',
    cacCertificateHelpText: 'Official Registration Certificate issued by Commercial Registry / Companies House / Secretary of State.',
    incorporationCertLabel: 'Certificate of Formation / Articles of Incorporation',
    incorporationCertHelpText: 'Official document confirming legal creation of the business entity.',
    memartLabel: 'Corporate Bylaws / Operating Agreement / Constitution',
    memartHelpText: 'Entity operating agreement, bylaws, or memorandum governing corporate decisions.',
    directorsDocumentLabel: 'Register of Directors / Certificate of Incumbency',
    directorsDocumentHelpText: 'Official register, Incumbency Certificate, or Extract listing authorized directors/officers.',
    taxIdLabel: 'Tax Identification Number (EIN / Tax ID)',
    taxIdPlaceholder: 'e.g. EIN 12-3456789 or Corporate Tax ID',
    taxClearanceLabel: 'Tax Exemption / Good Standing Certificate / IRS W-9',
    taxClearanceHelpText: 'Certificate of Good Standing, W-9/W-8BEN-E, or official tax compliance proof.',
    directorIdTypes: [
      { value: 'passport', label: 'Government International Passport' },
      { value: 'national_id', label: 'National Identity Card' },
      { value: 'drivers_license', label: "State/National Driver's License" },
    ],
  };
}
