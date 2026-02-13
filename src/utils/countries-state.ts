
import sc from "states-cities-db";

// Get the list of countries from the database
export const COUNTRIES = sc.getCountries();

// Function to get the telephone code for a specific country
export const getCountryTelCode = (countryIso: string) => {
    if (!countryIso) return undefined;

    const foundCountry = COUNTRIES.find(({ iso }) => iso === countryIso);
    return foundCountry?.prefix;
};

// Exporting constants and functions
export const countryOptions = COUNTRIES.map(({ name, iso }) => ({
    label: name,
    value: iso,
}));
