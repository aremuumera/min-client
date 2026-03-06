/**
 * Simple Frontend Logger
 */
export const logger = {
  info: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === "development") {
      console.log(
        `%c[INFO] ${message}`,
        "color: #3b82f6; font-weight: bold;",
        ...args,
      );
    }
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(
      `%c[WARN] ${message}`,
      "color: #f59e0b; font-weight: bold;",
      ...args,
    );
  },
  error: (message: string, ...args: any[]) => {
    console.error(
      `%c[ERROR] ${message}`,
      "color: #ef4444; font-weight: bold;",
      ...args,
    );
  },
  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(
        `%c[DEBUG] ${message}`,
        "color: #6b7280; font-weight: bold;",
        ...args,
      );
    }
  },
};
