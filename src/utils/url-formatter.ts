// Function to format company name (spaces to hyphens) for URL generation
export const formatCompanyNameForUrl = (
  companyName: string | undefined,
): string => {
  return companyName?.replace(/\s+/g, "-") || "";
};

// Function to decode company name (hyphens back to spaces) for matching in data
export const decodeCompanyNameFromUrl = (
  companyName: string | undefined,
): string => {
  return companyName?.replace(/-/g, " ") || "";
};
