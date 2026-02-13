import { Country } from 'country-state-city';

// Get all countries
const COUNTRIES = Country.getAllCountries();

// Function to get the telephone code for a specific country
export const getCountryTelCode = (countryIso: string): string | undefined => {
    if (!countryIso) return undefined;
    const foundCountry = COUNTRIES.find(({ isoCode }) => isoCode === countryIso);
    return foundCountry ? `+${foundCountry.phonecode}` : undefined;
};

// Export countries
export { COUNTRIES };

// Country options for select dropdowns
export const countryOptions = COUNTRIES.map(({ name, isoCode }) => ({
    label: name,
    value: isoCode,
}));
