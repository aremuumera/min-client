/**
 * Formats a number or string into a thousand-separator format (e.g., 1000 -> 1,000)
 */
export const formatNumberWithCommas = (
  value: string | number | undefined | null,
): string => {
  if (value === undefined || value === null || value === "") return "";

  // Remove existing commas first
  const cleanValue = value.toString().replace(/,/g, "");

  // Check if it's a valid number
  if (isNaN(Number(cleanValue))) return value.toString();

  // Split decimal part if exists
  const parts = cleanValue.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return parts.join(".");
};

/**
 * Strips commas from a formatted string (e.g., 1,000 -> 1000)
 */
export const stripCommas = (value: string): string => {
  return value.replace(/,/g, "");
};
