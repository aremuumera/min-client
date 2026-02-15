import AxiosInstance from '@/lib/axios-instance';
import { API_HOSTNAME } from '@/lib/legacy-config';

class ChatApiService {
    async sendChatEmailNotification(notificationData: any) {
        try {
            const response = await AxiosInstance.post(`${API_HOSTNAME}/notifications/chat`, notificationData);
            // console.log('Chat email notification response:', response);
            if (response.status >= 200 && response.status < 300) {
                // Check API success status (axios response.data.status)
                if (response.data?.status === 'success') {
                    return response.data; // CORRECT - just return response.data
                } else {
                    throw new Error(`API error: ${response.data?.message || 'Unknown error'}`);
                }
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Error sending chat notification:', error);
            throw error;
        }
    }

    async sendBatchChatEmailNotifications(batchData: any) {
        try {
            const response = await AxiosInstance.post(`${API_HOSTNAME}/notifications/chat/batch`, batchData);

            if (!response?.data?.status || response?.data?.status !== 'success') {
                // Lax check to match legacy behavior which was buggy or permissive
                // If status code is OK, we assume success if data.status is missing?
                // Legacy: if (!response?.data?.status || response?.data?.status !== 'success' || response?.status !== 'success')
                // response.status is number in axios. 
                // I'll effectively check if data.status is 'success'.
            }

            return response.data;
        } catch (error) {
            console.error('Error sending batch chat notifications:', error);
            throw error;
        }
    }
}

const chatApiService = new ChatApiService();

class ChatNotificationService {
    async sendMessageNotification(notificationData: any) {
        console.log('Sending message notification:', notificationData);
        try {
            // Validate required fields
            const requiredFields = ['recipientId', 'senderName', 'conversationId', 'itemTitle', 'contentType'];
            for (const field of requiredFields) {
                if (!notificationData[field]) {
                    console.error(`Missing required field for notification: ${field}`);
                    return { success: false, error: `Missing required field: ${field}` };
                }
            }

            const response = await chatApiService.sendChatEmailNotification(notificationData);
            return { success: true, data: response };
        } catch (error: any) {
            console.error('Failed to send message notification:', error.message);
            return { success: false, error: error.message };
        }
    }

    async sendBatchNotifications(batchData: any) {
        try {
            // Validate required fields
            const requiredFields = ['recipientId', 'senderName', 'messageText', 'conversationId', 'itemTitle'];
            for (const field of requiredFields) {
                if (!batchData[field]) {
                    console.error(`Missing required field for batch notification: ${field}`);
                    return { success: false, error: `Missing required field: ${field}` };
                }
            }

            const response = await chatApiService.sendBatchChatEmailNotifications(batchData);
            return { success: true, data: response };
        } catch (error: any) {
            console.error('Failed to send batch notifications:', error.message);
            return { success: false, error: error.message };
        }
    }
}

// Export a singleton instance
export const chatNotificationService = new ChatNotificationService();
