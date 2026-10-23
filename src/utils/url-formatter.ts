// Function to format company name (spaces to hyphens) for URL generation
export const formatCompanyNameForUrl = (
  companyName: string | undefined,
): string => {
  if (!companyName) return "";
  return companyName
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

// Function to decode company name (hyphens back to spaces) for matching in data
export const decodeCompanyNameFromUrl = (
  companyName: string | undefined,
): string => {
  if (!companyName) return "";
  return companyName.replace(/-/g, " ");
};
