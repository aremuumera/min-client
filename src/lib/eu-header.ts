/* The EU header of a passport (decisions #138, #139): what its owner makes public about the operator, the facility and the product's GS1 numbers */
export interface EuHeader {
  passportId: string;
  passportCode: string;
  granularity: 'item' | 'batch' | 'model';
  economicOperatorName: string | null;
  economicOperatorIdScheme: string | null;
  economicOperatorId: string | null;
  facilityIdScheme: string | null;
  facilityId: string | null;
  gtin: string | null;
  lot: string | null;
  serial: string | null;
  gs1DigitalLink: string | null;
  minmegCodes: string[];
  complete: boolean;
  missing: string[];
  publicUrl: string;
  updatedAt: string | null;
}
export type EuHeaderInput = Pick<EuHeader, 'economicOperatorName' | 'economicOperatorIdScheme' | 'economicOperatorId' | 'facilityIdScheme' | 'facilityId' | 'gtin' | 'lot' | 'serial'>;

export const OPERATOR_SCHEMES = [
  { value: 'EORI', label: 'EORI number (EU customs)' },
  { value: 'VAT', label: 'VAT number' },
  { value: 'LEI', label: 'LEI (legal entity identifier)' },
  { value: 'NATIONAL_REGISTER', label: 'Company registration number' },
  { value: 'OTHER', label: 'Another number' },
];
export const FACILITY_SCHEMES = [
  { value: 'GLN', label: 'GLN (GS1 location number)' },
  { value: 'NATIONAL_REGISTER', label: 'Licence or registration number' },
  { value: 'OTHER', label: 'Another number' },
];
export const MISSING_LABEL: Record<string, string> = { economicOperatorName: "the operator's name", economicOperatorId: "the operator's number", facilityId: 'the facility number', uniqueProductIdentifier: 'a product number (a GTIN, or a MINMEG code on the goods)' };
export const GRANULARITY_LABEL: Record<string, string> = { item: 'one item', batch: 'one batch', model: 'a product model' };
