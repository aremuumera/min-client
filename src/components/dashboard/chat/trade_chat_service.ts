/**
 * Trade Chat Service — Customer Frontend
 *
 * This service handles trade conversations from the buyer/supplier/inspector perspective.
 * Messages are routed to the Admin (Min-meg Trade Desk), NOT to the other party directly.
 *
 * Uses the `trade_rooms` Firebase collection with Hub-and-Spoke architecture.
 */

import { db, storage } from '@/lib/firebase';
import {
    addDoc,
    collection,
    doc,
    getDoc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    increment,
    getDocs,
    where,
    writeBatch,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { chatNotificationService } from './chat_notif_service';

// ─── Types ────────────────────────────────────────────────────────

export type UserSpokeType = 'admin_buyer' | 'admin_supplier' | 'admin_inspector';

export interface TradeRoomMetadata {
    inquiry_id: string;
    entity_type: string;
    status: string;
    buyer_id: string;
    supplier_id?: string;
    inspector_id?: string;
    assigned_admin_id?: string;
    item_name?: string;
    mineral_tag?: string;
    quantity?: string;
    measure_type?: string;
    buyer_name?: string;
    supplier_name?: string;
    inspector_name?: string;
    created_at?: any;
    updated_at?: any;
}

export interface TradeMessage {
    id: string;
    sender_id: string;
    sender_role: string;
    sender_display: string;
    sender_name: string;
    text: string;
    timestamp: any;
    type: 'text' | 'system' | 'document' | 'attachment';
    attachments?: any[];
    isRead?: boolean;
}

// ─── Service ──────────────────────────────────────────────────────

export const customerTradeChatService = {

    /**
     * Create a new trade room when an inquiry is created
     */
    async createTradeRoom(inquiryId: string, metadata: Omit<TradeRoomMetadata, 'created_at' | 'updated_at'>): Promise<string> {
        try {
            const roomRef = doc(db, 'trade_rooms', inquiryId);
            const existing = await getDoc(roomRef);

            if (existing.exists()) {
                return inquiryId;
            }

            await setDoc(roomRef, {
                ...metadata,
                inquiry_id: inquiryId,
                created_at: serverTimestamp(),
                updated_at: serverTimestamp(),
            });

            // Initialize spoke thread metadata docs
            const spokes: UserSpokeType[] = ['admin_buyer', 'admin_supplier', 'admin_inspector'];
            for (const spoke of spokes) {
                await setDoc(doc(db, 'trade_rooms', inquiryId, 'threads', spoke), {
                    created_at: serverTimestamp(),
                    last_message: null,
                    message_count: 0,
                });
            }

            return inquiryId;
        } catch (error) {
            console.error('Error creating trade room:', error);
            throw error;
        }
    },

    /**
     * Determine which spoke thread a user should access based on their role.
     */
    getUserSpoke(userRole: string): UserSpokeType {
        switch (userRole) {
            case 'buyer': return 'admin_buyer';
            case 'supplier': return 'admin_supplier';
            case 'inspector': return 'admin_inspector';
            default: return 'admin_buyer';
        }
    },

    /**
     * Get messages for a user's spoke (real-time)
     */
    getSpokeMessages(tradeId: string, spoke: UserSpokeType, callback: (messages: TradeMessage[]) => void) {
        const messagesRef = collection(db, 'trade_rooms', tradeId, 'threads', spoke, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));

        return onSnapshot(q, (snapshot) => {
            const messages: TradeMessage[] = snapshot.docs.map((d) => ({
                id: d.id,
                ...d.data(),
            })) as TradeMessage[];

            callback(messages);
        });
    },

    /**
     * Send a message to the admin (via the user's spoke)
     */
    async sendMessage(
        tradeId: string,
        spoke: UserSpokeType,
        senderId: string,
        senderRole: string,
        senderName: string,
        senderCompanyName: string,
        text: string,
        attachments: any[] = []
    ): Promise<string> {
        try {
            const messagesRef = collection(db, 'trade_rooms', tradeId, 'threads', spoke, 'messages');

            const messageData = {
                sender_id: senderId,
                sender_role: senderRole,
                sender_display: senderName,
                sender_name: senderName,
                sender_company_name: senderCompanyName,
                text,
                timestamp: serverTimestamp(),
                type: attachments.length > 0 ? 'attachment' : 'text',
                attachments: attachments || [],
                isRead: false,
            };

            const msgRef = await addDoc(messagesRef, messageData);

            // Update thread metadata
            await updateDoc(doc(db, 'trade_rooms', tradeId, 'threads', spoke), {
                last_message: {
                    text: text || (attachments.length > 0 ? '📎 Attachment' : ''),
                    sender_display: senderName,
                    timestamp: serverTimestamp(),
                },
                message_count: increment(1),
            });

            // Update room's updated_at and summary
            await updateDoc(doc(db, 'trade_rooms', tradeId), {
                updated_at: serverTimestamp(),
                last_active_spoke: spoke,
                last_message: {
                    text: text || (attachments.length > 0 ? '📎 Attachment' : ''),
                    sender_display: senderName,
                    timestamp: serverTimestamp(),
                }
            });

            // Trigger notification for Admin
            // In Hub-And-Spoke, messages from users go to 'admin'
            // We'll notify GLOBAL_ADMIN for the bell and any specific assigned admin if we can find them
            const roomDoc = await getDoc(doc(db, 'trade_rooms', tradeId));
            const roomData = roomDoc.data();

            if (roomData) {
                // Determine recipient: assigned admin or GLOBAL_ADMIN
                const recipientId = roomData.assigned_admin_id || 'GLOBAL_ADMIN';

                await createNotification(
                    recipientId,
                    senderId,
                    senderName,
                    senderCompanyName,
                    tradeId,
                    {
                        itemType: roomData.entity_type || 'product',
                        itemId: roomData.inquiry_id || tradeId,
                        title: roomData.item_name || roomData.mineral_tag?.replace(/_/g, ' ') || 'Trade Inquiry'
                    },
                    text || (attachments.length > 0 ? '📎 Attachment' : ''),
                    'new_message',
                    attachments.length > 0 ? 'file' : 'text'
                );
            }

            return msgRef.id;
        } catch (error) {
            console.error('Error sending trade message:', error);
            throw error;
        }
    },

    /**
     * Mark messages as read
     */
    async markSpokeAsRead(tradeId: string, spoke: UserSpokeType, userId: string): Promise<void> {
        try {
            const messagesRef = collection(db, 'trade_rooms', tradeId, 'threads', spoke, 'messages');
            const q = query(messagesRef, where('isRead', '==', false), where('sender_id', '!=', userId));
            const snapshot = await getDocs(q);

            const batch = writeBatch(db);
            snapshot.docs.forEach((d) => {
                batch.update(d.ref, { isRead: true, readAt: serverTimestamp() });
            });

            if (snapshot.docs.length > 0) {
                await batch.commit();
            }
        } catch (error) {
            console.error('Error marking spoke as read:', error);
        }
    },

    /**
     * Upload an attachment
     */
    async uploadAttachment(file: File, tradeId: string, spoke: UserSpokeType): Promise<{ url: string; name: string; type: string }> {
        try {
            const filePath = `trade_rooms/${tradeId}/${spoke}/${Date.now()}_${file.name}`;
            const storageRef = ref(storage, filePath);
            const uploadTask = uploadBytesResumable(storageRef, file);

            return new Promise((resolve, reject) => {
                uploadTask.on(
                    'state_changed',
                    null,
                    (error) => reject(error),
                    async () => {
                        const url = await getDownloadURL(uploadTask.snapshot.ref);
                        resolve({
                            url,
                            name: file.name,
                            type: file.type.startsWith('image/') ? 'image' : 'file',
                        });
                    }
                );
            });
        } catch (error) {
            console.error('Error uploading trade attachment:', error);
            throw error;
        }
    },

    /**
     * Get trade room metadata
     */
    async getTradeRoomMetadata(tradeId: string): Promise<any | null> {
        try {
            const roomDoc = await getDoc(doc(db, 'trade_rooms', tradeId));
            if (!roomDoc.exists()) return null;
            return roomDoc.data();
        } catch (error) {
            console.error('Error getting trade room:', error);
            return null;
        }
    },

    /**
     * Get trade rooms for a specific user and role formatted as Conversations for the Sidebar
     */
    getUserTradeRooms(userId: string, role: string, callback: (conversations: any[]) => void) {
        let roleField = '';
        switch (role) {
            case 'buyer': roleField = 'buyer_id'; break;
            case 'supplier': roleField = 'supplier_id'; break;
            case 'inspector': roleField = 'inspector_id'; break;
            default: roleField = 'buyer_id'; // Fallback
        }

        const q = query(
            collection(db, 'trade_rooms'),
            where(roleField, '==', userId)
        );

        return onSnapshot(q, async (snapshot) => {
            try {
                const rooms = await Promise.all(snapshot.docs.map(async (docSnap) => {
                    try {
                        const data = docSnap.data();
                        const tradeId = docSnap.id;

                        // Get the specific spoke thread for this user
                        const spoke = this.getUserSpoke(role);
                        const threadDoc = await getDoc(doc(db, 'trade_rooms', tradeId, 'threads', spoke));
                        const threadData = threadDoc.exists() ? threadDoc.data() : { last_message: null, message_count: 0 };

                        // TEMPORARY: Default unreadCount to 0 to avoid composite index failure
                        // In a real scenario, the user should provide the index.
                        // We will add back proper unread counting once indices are confirmed.
                        const unreadCount = 0;

                        const lastMsgTime = threadData.last_message?.timestamp?.toDate?.()
                            || data.updated_at?.toDate?.()
                            || data.created_at?.toDate?.()
                            || new Date();

                        return {
                            conversationId: tradeId,
                            conversationType: 'trade',
                            itemType: data.entity_type || 'product',
                            itemId: data.inquiry_id || tradeId,
                            itemTitle: data.item_name || data.mineral_tag?.replace(/_/g, ' ') || 'Trade Inquiry',
                            otherUserId: 'admin',
                            otherUserName: 'Min-meg Trade Desk',
                            otherCompanyName: 'Platform Admin',
                            lastMessageTime: lastMsgTime,
                            unreadCount: unreadCount,
                            metadata: data,
                        };
                    } catch (itemError) {
                        console.error(`Error loading room ${docSnap.id}:`, itemError);
                        return null;
                    }
                }));

                // Filter out failed rooms and sort
                const validRooms = rooms.filter(r => r !== null);
                validRooms.sort((a, b) => {
                    const timeA = a.lastMessageTime ? a.lastMessageTime.getTime() : 0;
                    const timeB = b.lastMessageTime ? b.lastMessageTime.getTime() : 0;
                    return timeB - timeA;
                });

                callback(validRooms);
            } catch (error) {
                console.error("Error formatting trade rooms: ", error);
                callback([]);
            }
        });
    },
};

const createNotification = async (
    userId: string,
    senderId: string,
    senderName: string,
    senderCompanyName: string,
    conversationId: string,
    itemRef: any,
    message: string,
    type: string,
    contentType?: string
) => {
    try {
        await addDoc(collection(db, 'notifications'), {
            userId,
            type,
            conversationId,
            senderId,
            senderName,
            senderCompanyName,
            itemType: itemRef.itemType,
            itemTitle: itemRef.title,
            itemId: itemRef.itemId,
            message: message.substring(0, 100),
            timestamp: serverTimestamp(),
            isRead: false,
            contentType: contentType || 'text',
        });

        // Skip email for GLOBAL_ADMIN as it might not have a valid email record linked to UUID logic
        if (userId === 'GLOBAL_ADMIN') return;

        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            await chatNotificationService.sendMessageNotification({
                recipientId: userId,
                senderName,
                senderCompanyName,
                messageText: message,
                conversationId,
                itemTitle: itemRef.title,
                fullName: userData.displayName || 'User',
                contentType: contentType || 'text',
            });
        }
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};
