/**
 * Error Handling Utility
 * Replicates the logic from the original useHandleErr.js
 */
export const handleApiError = (err: any) => {
    if (err.response && err.response.data && err.response.status === 411) {
        return {
            message: err.response.data.message || 'An error occurred',
            status: err.response.status || 500,
            email: err.response.data.email || '',
        };
    } else if (err.response && err.response.data) {
        // Server responded with a status code outside the range of 2xx
        return {
            message: err.response.data.message || 'An error occurred',
            status: err.response.status || 500,
        };
    } else if (err.request) {
        // Request was made but no response was received
        return {
            message: 'No response from server. Please check your connection.',
            status: 408, // Commonly used for timeout errors
        };
    } else {
        // Error in setting up the request
        return {
            message: err.message || 'An error occurred',
            status: 500,
        };
    }
};

/**
 * Hook version if needed (original was a hook but behaved like a pure function)
 */
export const useHandleErr = () => {
    return handleApiError;
};
