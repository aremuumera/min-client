/* Markets (decision #142): where a passport is meant to be used; a label with a flag or a picture */
export interface MarketBrief {
  id: string;
  code: string;
  name: string;
  /** Two letters (EU for the European Union): the flag shown when no picture was uploaded (see lib/flags.ts) */
  countryCode: string | null;
  imageUrl: string | null;
}
export interface Market extends MarketBrief {
  description: string | null;
  active: boolean;
  templates?: number;
  standards?: number;
}
