/* Markets (decision #142): where a passport is meant to be used; a label with a flag or a picture */
export interface MarketBrief {
  id: string;
  code: string;
  name: string;
  /** Two letters (EU for the European Union): the flag shown when no picture was uploaded */
  countryCode: string | null;
  imageUrl: string | null;
}
export interface Market extends MarketBrief {
  description: string | null;
  active: boolean;
  templates?: number;
  standards?: number;
}

/** The flag of a two-letter country code, as an emoji (EU works too). Empty when the code is not two letters. */
export function flagOf(countryCode: string | null | undefined): string {
  const code = (countryCode ?? '').toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return '';
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}
