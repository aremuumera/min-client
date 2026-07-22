const err = {
  status: 422,
  data: {
    success: false,
    error: {
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      statusCode: 422,
      timestamp: "2026-07-22T07:00:14.960Z",
      errors: [
        "phoneNumber: Invalid phone number for the provided country code"
      ]
    }
  }
};

function getErrorMessage(err, fallback = 'An unexpected error occurred.') {
    if (!err) return fallback;
    if (typeof err === 'string') return err;

    // 1. Check for nested validation errors array inside err.data or err
    const data = err?.data || err;
    const validationErrors = data?.errors || data?.error?.errors;
    if (validationErrors && Array.isArray(validationErrors)) {
        return validationErrors
            .map((e) => {
                const messageString = typeof e === 'string' ? e : e?.message || JSON.stringify(e);
                // Strip field prefix (e.g., "phoneNumber: Invalid phone number" -> "Invalid phone number")
                if (messageString.includes(': ')) {
                    return messageString.split(': ').slice(1).join(': ');
                }
                return messageString;
            })
            .join(', ');
    }

    // 2. Check: err.data.message
    if (err?.data?.message && typeof err.data.message === 'string') {
        return err.data.message;
    }

    // 3. Check: err.data.error (string or object)
    if (err?.data?.error) {
        if (typeof err.data.error === 'string') return err.data.error;
        if (typeof err.data.error === 'object' && err.data.error.message && typeof err.data.error.message === 'string') {
            return err.data.error.message;
        }
    }

    // 4. Check: err.error.message
    if (err?.error?.message && typeof err.error.message === 'string') {
        return err.error.message;
    }

    // 5. Check: err.error (string)
    if (err?.error && typeof err.error === 'string') {
        return err.error;
    }

    // 6. Check: err.message
    if (err?.message && typeof err.message === 'string') {
        return err.message;
    }

    // 7. Check: err.data (string)
    if (err?.data && typeof err.data === 'string') {
        return err.data;
    }

    return fallback;
}

console.log("RESULT:", getErrorMessage(err));
