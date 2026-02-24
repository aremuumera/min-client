import { db, storage } from '@/lib/firebase';
import { initializeApp } from 'firebase/app';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  increment,
  onSnapshot,
  orderBy,
  query,
  refEqual,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { toast } from 'sonner';

import { chatNotificationService } from '../chat_notif_service';

export const chatService = {
  // Start a new conversation
  startConversation: async (initiatorId: string, recipientId: string, itemData: any) => {
    try {
      if (!initiatorId) throw new Error('Missing initiator ID');
      if (!recipientId) throw new Error('Missing recipient ID');

      if (!itemData || !itemData.itemId) {
        throw new Error('Missing item data');
      }

      // console.log(`Starting conversation: initiator=${initiatorId}, recipient=${recipientId}, item=`, itemData);

      // Check if conversation already exists for these users and this item
      const conversationsRef = collection(db, 'conversations');
      const q = query(
        conversationsRef,
        where('itemRef.itemId', '==', itemData.itemId),
        where('participants', 'array-contains', initiatorId)
      );

      const querySnapshot = await getDocs(q);
      let conversationId;

      if (!querySnapshot.empty) {
        // Conversation exists, return its ID
        conversationId = querySnapshot.docs[0].id;

        // Verify the conversation has both participants
        const existingConv = querySnapshot.docs[0].data();
        if (!existingConv.participants.includes(recipientId)) {
          console.warn('Recipient not in existing conversation, updating participants');
          await updateDoc(doc(db, 'conversations', conversationId), {
            participants: [initiatorId, recipientId],
            updatedAt: serverTimestamp(),
          });
        }
      } else {
        // Create new conversation
        const conversationData = {
          participants: [initiatorId, recipientId],
          initiatorId,
          recipientId,
          itemRef: {
            itemId: itemData.itemId,
            itemType: itemData.itemType,
            title: itemData.title, // title is the  name of the item
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),

          isRead: false,
        };
        console.log('Creating new conversation with data:', conversationData);

        const conversationRef = await addDoc(collection(db, 'conversations'), conversationData);
        conversationId = conversationRef.id;

        const cp = itemData.companyName ? itemData.companyName : '';
        const cp2 = itemData.senderCompanyName ? itemData.senderCompanyName : '';

        console.log('New conversation created with ID:', conversationId, initiatorId, recipientId, cp, cp2, itemData);

        // Update user conversations for quick access
        const r = await updateUserConversations(
          initiatorId,
          recipientId,
          itemData.receiverName,
          cp,
          conversationId,
          itemData
        ); // updating the reciever user's userConversations
        const s = await updateUserConversations(
          recipientId,
          initiatorId,
          itemData.senderName,
          cp2,
          conversationId,
          itemData
        ); // updating the  initiator / sender user's userConversations
      }

      return conversationId;
    } catch (error) {
      console.error('Error starting conversation:', error);
      throw error;
    }
  },

  sendMessage: async (conversationId: string, senderId: string, senderName: string, senderCompanyName: string, text: string, attachments: any[] = [], contentType?: string) => {
    if (!conversationId) {
      throw new Error('Invalid conversation ID');
    }

    try {
      // Validate conversation exists first
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationSnap = await getDoc(conversationRef);

      if (!conversationSnap.exists()) {
        throw new Error('Conversation does not exist');
      }

      // Validate attachments
      const validatedAttachments = attachments.map((att) => ({
        url: att.url,
        name: att.name || 'file',
        type: att.type || (att.url.match(/\.(jpeg|jpg|gif|png)$/) ? 'image' : 'file'),
        size: att.size || 0,
      }));

      const messageData = {
        text,
        senderId,
        senderName,
        senderCompanyName,
        timestamp: serverTimestamp(),
        status: 'sent',
        isRead: false,
        attachments: validatedAttachments,
        contentType: contentType || 'text', // 'text' or 'file'
      };

      // console.log('Sending message data:', messageData);

      // Add message to subcollection
      const messageRef = await addDoc(collection(db, 'conversations', conversationId, 'messages'), messageData);

      //  setTimeout(async () => {
      //   await updateDoc(messageRef, {
      //     status: 'delivered',
      //     deliveredAt: serverTimestamp()
      //   });
      // }, 1000);

      // Automatically mark as delivered after 1 second
      setTimeout(async () => {
        try {
          await updateDoc(messageRef, {
            status: 'delivered',
            deliveredAt: serverTimestamp(),
          });

          // If recipient is currently viewing this conversation, mark as read immediately
          const convRef = doc(db, 'conversations', conversationId);
          const convSnap = await getDoc(convRef);
          if (convSnap.exists() && convSnap.data().isActive) {
            await updateDoc(messageRef, {
              status: 'read',
              isRead: true,
              readAt: serverTimestamp(),
            });
          }
        } catch (err) {
          // Message may have been deleted — ignore gracefully
          console.warn('Message delivery update skipped:', err);
        }
      }, 1000);

      const messageId = messageRef.id;

      // Update conversation with last message
      await updateDoc(doc(db, 'conversations', conversationId), {
        lastMessage: {
          text,
          timestamp: serverTimestamp(),
          senderId,
        },
        updatedAt: serverTimestamp(),
        isRead: false,
      });

      // Get conversation to find recipient
      const conversationDoc = await getDoc(doc(db, 'conversations', conversationId));
      const conversationData = conversationDoc.data();
      if (!conversationData) throw new Error('Conversation data not found');
      const recipientId = conversationData.participants.find((id: string) => id !== senderId);

      if (!recipientId) {
        throw new Error('Recipient not found in conversation');
      }

      // Update unread count for recipient
      const userConversationRef = doc(db, 'userConversations', recipientId);
      const userConvDoc = await getDoc(userConversationRef);

      if (userConvDoc.exists()) {
        await updateDoc(userConversationRef, {
          [`conversations.${conversationId}.unreadCount`]: increment(1),
          [`conversations.${conversationId}.lastMessage`]: text.substring(0, 50),
          [`conversations.${conversationId}.lastMessageTime`]: serverTimestamp(),
        });
      }

      // Create notification
      await createNotification(
        recipientId,
        senderId,
        senderName,
        senderCompanyName,
        conversationId,
        conversationData.itemRef,
        text,
        'new_message',
        contentType
      );

      return { success: true, messageId };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Getting  messages from a conversation with real-time updates
  getMessages: (conversationId: string, callback: (messages: any[]) => void) => {
    if (!conversationId) return null;

    const messagesQuery = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    return onSnapshot(messagesQuery, async (snapshot) => {
      const messages = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
        timestamp: docSnap.data().timestamp?.toDate(),
      })) as any[];

      // Get current names for all senders
      const senderIds = [...new Set(messages.map((m: any) => m.senderId))] as string[];

      const currentNames = await Promise.all(
        senderIds.map(async (senderId: string) => {
          const userData = await getUserName(senderId);
          return {
            senderId,
            currentName: userData?.name,
            currentCompanyName: userData?.company_name,
          };
        })
      );

      // Create proper name and company maps
      const nameMap: Record<string, { name: string | undefined; companyName: string | undefined }> = {};
      currentNames.forEach(({ senderId, currentName, currentCompanyName }) => {
        nameMap[senderId] = {
          name: currentName,
          companyName: currentCompanyName,
        };
      });

      // Enhance messages with current names
      const enhancedMessages = messages.map((message: any) => ({
        ...message,
        currentSenderName: nameMap[message.senderId]?.name || message.senderName,
        currentSenderCompanyName: nameMap[message.senderId]?.companyName || message.senderCompanyName,
      }));

      callback(enhancedMessages);
    });
  },

  // Enhance to handle name changes in real-time

  getUserConversations: (userId: string, callback: (conversations: any[]) => void) => {
    return onSnapshot(doc(db, 'userConversations', userId), async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const convs = Object.values(data.conversations || {}) as any[];

        // Get current names for all other users
        // const namePromises = convs.map(conv =>
        //   getUserName(conv.otherUserId)
        // );

        const otherUserIds = convs.map((conv: any) => conv.otherUserId);

        const namePromises = otherUserIds.map(async (otherUserId: string) => {
          const userData = await getUserName(otherUserId);
          // console.log('userData', userData, otherUserId);
          return {
            otherUserId: otherUserId,
            name: userData?.name,
            companyName: userData?.company_name,
          };
        });

        const userDataResults = await Promise.all(namePromises);

        // Create map for easy lookup
        const userDataMap: Record<string, { name: string | undefined; companyName: string | undefined }> = {};
        userDataResults.forEach(({ otherUserId, name, companyName }) => {
          userDataMap[otherUserId] = {
            name,
            companyName,
          };
        });

        const enhanced = convs
          .map((conv: any) => ({
            ...conv,
            currentOtherUserName: userDataMap[conv.otherUserId]?.name || conv.otherUserName,
            currentOtherUserCompanyName: userDataMap[conv.otherUserId]?.companyName || conv.otherUserCompanyName,
            lastMessageTime: conv.lastMessageTime || conv.lastMessageTime,
            itemId: conv.itemRef?.itemId || conv.itemId,
          }))
          .sort((a: any, b: any) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));

        callback(enhanced);
      } else {
        callback([]);
      }
    });
  },

  // Mark messages as read
  markConversationAsRead: async (conversationId: string, userId: string) => {
    try {
      // Update conversation document
      await updateDoc(doc(db, 'conversations', conversationId), {
        isRead: true,
      });

      // Update user's unread count
      const userConversationsRef = doc(db, 'userConversations', userId);
      const docSnap = await getDoc(userConversationsRef);

      if (docSnap.exists()) {
        await updateDoc(userConversationsRef, {
          [`conversations.${conversationId}.unreadCount`]: 0,
        });
      }

      // Mark notifications as read
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('conversationId', '==', conversationId),
        where('isRead', '==', false)
      );

      const snapshot = await getDocs(notificationsQuery);
      snapshot.forEach(async (doc) => {
        await updateDoc(doc.ref, { isRead: true });
      });

      return true;
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      throw error;
    }
  },

  clearAllNotifications: async (userId: string) => {
    try {
      const notificationsQuery = query(collection(db, 'notifications'), where('userId', '==', userId));

      const snapshot = await getDocs(notificationsQuery);
      const batch = writeBatch(db);

      console.log(`Deleting ${snapshot.size} notifications for user: ${userId}`);

      // Delete all notifications
      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error deleting notifications:', error);
      throw error;
    }
  },

  clearSingleNotification: async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        isRead: true,
      });
      return true;
    } catch (error) {
      console.error('Error clearing notification:', error);
      throw error;
    }
  },

  // Get user's notifications with real-time updates
  getUserNotifications: (userId: string, callback: (notifications: any[]) => void) => {
    if (!userId) return null;

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );

    return onSnapshot(notificationsQuery, (snapshot) => {
      const notifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate(), // Convert Firestore timestamp to JS Date
      }));
      callback(notifications);
    });
  },

  // Upload file attachment (image)
  uploadAttachment: async (file: File, conversationId: string) => {
    try {
      // 1. Create a reference to the storage location
      const storageRef = ref(storage, `attachments/${conversationId}/${file.name}`);

      // 2. Upload the file
      const uploadTask = uploadBytesResumable(storageRef, file);

      // 3. Wait for upload to complete
      await uploadTask;

      // 4. Get the download URL
      const downloadURL = await getDownloadURL(storageRef);

      return {
        url: downloadURL,
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        size: file.size,
      };
    } catch (error: any) {
      toast.error(`${error?.message || 'Failed to upload attachment. Please try again.'}`);
      console.error('Error uploading attachment:', error);
      throw error;
    }
  },

  deleteAttachment: async (conversationId: string, messageId: string, attachmentIndex: number) => {
    try {
      const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
      const messageDoc = await getDoc(messageRef);

      if (!messageDoc.exists()) {
        throw new Error('Message not found');
      }

      const messageData = messageDoc.data();
      const attachments = messageData.attachments || [];

      if (!attachments[attachmentIndex]) {
        throw new Error('Attachment not found');
      }

      const attachment = attachments[attachmentIndex];

      // Only try to delete from storage if it's not already a deleted marker
      if (attachment.type !== 'deleted') {
        try {
          // Delete from Firebase Storage
          const fileRef = ref(storage, attachment.url);
          await deleteObject(fileRef);
        } catch (storageError: any) {
          // If file not found, we'll still proceed with removing from Firestore
          if (storageError.code !== 'storage/object-not-found') {
            throw storageError;
          }
          console.warn('File already deleted from storage');
        }
      }

      // Instead of removing the attachment, mark it as deleted
      const updatedAttachments = [...attachments];
      updatedAttachments[attachmentIndex] = {
        type: 'deleted',
        name: attachment.name || 'Unknown file',
      };

      // to be use for soft deleting and then comenting the storage delete to prevent error or deleting from storage
      // updatedAttachments[attachmentIndex] = {
      //   type: 'deleted',
      //   name: attachment.name || 'Unknown file',
      //   type: attachment.type,
      //   url: attachment.url,
      //   size: attachment.size,

      // };

      // // COMPLETELY REMOVE the attachment from the array
      // const updatedAttachments = [
      //   ...attachments.slice(0, attachmentIndex),
      //   ...attachments.slice(attachmentIndex + 1)
      // ];

      // Update the message document
      await updateDoc(messageRef, {
        attachments: updatedAttachments,
        // Only update text if it was empty
        deletedAt: serverTimestamp(),
        // attachmentType: attachment.type,          // to be used for soft deleting
        //   deletedBy: messageData.senderId  // to  Track who deleted it and to be  used for soft deleting
        // text: messageData.text || "[Attachment removed]"
      });

      return true;
    } catch (error) {
      console.error('Error deleting attachment:', error);
      throw error;
    }
  },

  // Add this to your chat service
  updateItemTitle: async (userId: string, itemId: string, newTitle: string) => {
    const conversationsQuery = query(collection(db, 'conversations'), where('itemRef.itemId', '==', itemId));

    const snap = await getDocs(conversationsQuery);
    const batch = writeBatch(db);

    snap.docs.forEach((doc) => {
      batch.update(doc.ref, {
        'itemRef.title': newTitle,
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();

    // Also update userConversations
    await refreshItemTitles(userId, newTitle);
  },

  //  updateMessageStatus: async (conversationId, messageId, status) => {
  //   try {
  //     await updateDoc(doc(db, 'conversations', conversationId, 'messages', messageId), {
  //       status
  //     });
  //     return true;
  //   } catch (error) {
  //     console.error("Error updating message status:", error);
  //     throw error;
  //   }
  // },

  markMessageAsDelivered: async (conversationId: string, messageId: string) => {
    try {
      await updateDoc(doc(db, 'conversations', conversationId, 'messages', messageId), {
        status: 'delivered',
        deliveredAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error('Error marking message as delivered:', error);
      throw error;
    }
  },

  markMessageAsRead: async (conversationId: string, messageId: string) => {
    try {
      await updateDoc(doc(db, 'conversations', conversationId, 'messages', messageId), {
        status: 'read',
        isRead: true,
        readAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  },

  // In chat_service.js
  trackConversationActivity: (conversationId: string, userId: string) => {
    const conversationRef = doc(db, 'conversations', conversationId);

    // Mark as active when user views conversation
    setDoc(
      conversationRef,
      {
        activeParticipants: arrayUnion(userId),
        lastActive: serverTimestamp(),
      },
      { merge: true }
    );

    // Return unsubscribe function
    return () => {
      setDoc(
        conversationRef,
        {
          activeParticipants: arrayRemove(userId),
        },
        { merge: true }
      );
    };
  },
};

// Helper functions
const updateUserConversations = async (
  userId: string,
  otherUserId: string,
  otherUserName: string,
  otherCompanyName: string,
  conversationId: string,
  itemData: any
) => {
  try {
    const userConversationRef = doc(db, 'userConversations', userId);
    const userConversationDoc = await getDoc(userConversationRef);

    if (userConversationDoc.exists()) {
      // Update existing document
      await updateDoc(userConversationRef, {
        [`conversations.${conversationId}`]: {
          conversationId,
          otherUserId,
          otherUserName,
          otherCompanyName,
          itemType: itemData.itemType,
          itemTitle: itemData.title,
          lastMessageTime: serverTimestamp(),
          unreadCount: 0,
          itemId: itemData.itemId,
        },
      });
    } else {
      // Create new document
      await setDoc(userConversationRef, {
        conversations: {
          [conversationId]: {
            conversationId,
            otherUserId,
            otherUserName,
            otherCompanyName,
            itemType: itemData.itemType,
            itemTitle: itemData.title,
            lastMessageTime: serverTimestamp(),
            unreadCount: 0,
            itemId: itemData.itemId,
          },
        },
      });
    }
  } catch (error) {
    console.error('Error updating user conversations:', error);
    throw error;
  }
};

const deleteConversation = async (conversationId: string, userIds: string[]) => {
  try {
    const conversationRef = doc(db, 'conversations', conversationId);

    // 1. Delete all messages under the conversation
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const messagesSnap = await getDocs(messagesRef);
    const deletePromises = messagesSnap.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    // 2. Delete conversation document
    await deleteDoc(conversationRef);

    // 3. Remove conversation from each user's userConversations
    const userUpdatePromises = userIds.map((uid: string) => {
      const userConvRef = doc(db, 'userConversations', uid);
      return updateDoc(userConvRef, {
        [`conversations.${conversationId}`]: deleteField(),
      });
    });
    deletePromises.push(...userUpdatePromises);

    // 4. Delete any related notifications (assuming a known structure)
    const notificationsDeletes = userIds.map(async (uid: string) => {
      const notifQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', uid),
        where('conversationId', '==', conversationId)
      );
      const notifSnap = await getDocs(notifQuery);
      return Promise.all(notifSnap.docs.map((doc) => deleteDoc(doc.ref)));
    });
    await Promise.all(notificationsDeletes);

    // console.log(`Conversation ${conversationId} fully deleted.`);
  } catch (error) {
    console.error('Failed to delete conversation:', error);
    throw error;
  }
};

// Get current user name from Firebase or external source
export const getUserName = async (userId: string) => {
  if (!userId) {
    console.warn('getUserName called with null/undefined userId');
    return { name: 'Unknown User', company_name: '' };
  }
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        name: userData.displayName || 'Unknown User',
        company_name: userData.companyName || '',
      };
    }

    return { name: 'Unknown User', company_name: '' };
  } catch (error) {
    console.error('Error fetching user name:', error);
    return { name: 'Unknown User', company_name: '' };
  }
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
      contentType: contentType || 'text', // 'text' or 'file'
    });

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();

      // Check if the user has email notifications enabled (if you have such a setting)
      // const notificationsEnabled = userData.emailNotifications !== false; // Default to true if not set

      // if (notificationsEnabled) {
      // Send notification via our notification service
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
      // }
    } else {
      console.warn(`No email found for user ${userId}`);
    }
    console.log('Email notification would be sent here');
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Update item titles across conversations
const refreshItemTitles = async (userId: string, newTitle: string) => {
  const conversationsQuery = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', userId),
    where('itemRef.title', '!=', newTitle)
  );

  const snap = await getDocs(conversationsQuery);
  const batch = writeBatch(db);

  snap.docs.forEach((doc) => {
    batch.update(doc.ref, {
      'itemRef.title': newTitle,
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();

  // Also update userConversations
  const userConvsQuery = query(
    collection(db, 'userConversations'),
    where(`conversations.${userId}.itemTitle`, '!=', newTitle)
  );

  const userConvsSnap = await getDocs(userConvsQuery);
  const userConvBatch = writeBatch(db);

  userConvsSnap.forEach((doc) => {
    const convData = doc.data().conversations;
    Object.keys(convData).forEach((convId) => {
      if (convData[convId].itemTitle !== newTitle) {
        userConvBatch.update(doc.ref, {
          [`conversations.${convId}.itemTitle`]: newTitle,
        });
      }
    });
  });

  await userConvBatch.commit();
};

export const sendInvoiceMessage = async (conversationId: string, senderId: string, senderName: string, senderCompanyName: string, invoiceData: any) => {
  try {
    if (!conversationId) {
      throw new Error('Invalid conversation ID');
    }

    // Validate conversation exists
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationSnap = await getDoc(conversationRef);

    if (!conversationSnap.exists()) {
      throw new Error('Conversation does not exist');
    }

    const messageData = {
      text: `${senderName} from ${senderCompanyName} Created a trade agreement for ${invoiceData.productName}`,
      senderId,
      senderName,
      senderCompanyName,
      timestamp: serverTimestamp(),
      status: 'sent',
      isRead: false,
      attachments: [],
      contentType: 'invoice', // Special type for invoice messages
      invoiceData: {
        id: invoiceData.id,
        productName: invoiceData.productName,
        quantity: invoiceData.quantity,
        unitType: invoiceData.unitType,
        unitPrice: invoiceData.unitPrice,
        // totalPrice: invoiceData.totalPrice,
        // currency: invoiceData.currency,
        tradeType: invoiceData.tradeType,
        incoterm: invoiceData.incoterm,
        status: invoiceData.status,
        samplingState: invoiceData.samplingState,
        samplingLGA: invoiceData.samplingLGA,
        samplingAddress: invoiceData.samplingAddress,
        // inspectionDate: invoiceData.inspectionDate,
        // inspectionTime: invoiceData.inspectionTime,
        inspectionContactName: invoiceData.inspectionContactName,
        inspectionContactPhone: invoiceData.inspectionContactPhone,
        inspectionContactDialCode: invoiceData.inspectionContactDialCode,
        agreedGradePercentage: invoiceData.agreedGradePercentage,
        buyerId: invoiceData.buyerId,
        supplierId: invoiceData.supplierId,
        approvals: invoiceData.approvals || [],
      },
    };

    // Add message to subcollection
    const messageRef = await addDoc(collection(db, 'conversations', conversationId, 'messages'), messageData);

    // Mark as delivered after 1 second
    setTimeout(async () => {
      await updateDoc(messageRef, {
        status: 'delivered',
        deliveredAt: serverTimestamp(),
      });
    }, 1000);

    // Update conversation with last message
    await updateDoc(doc(db, 'conversations', conversationId), {
      lastMessage: {
        text: messageData.text,
        timestamp: serverTimestamp(),
        senderId,
      },
      updatedAt: serverTimestamp(),
      isRead: false,
    });

    // Get conversation to find recipient
    const conversationDoc = await getDoc(doc(db, 'conversations', conversationId));
    const conversationData = conversationDoc.data();
    if (!conversationData) throw new Error('Conversation data not found');
    const recipientId = conversationData.participants.find((id: string) => id !== senderId);

    if (!recipientId) {
      throw new Error('Recipient not found in conversation');
    }

    // Update unread count for recipient
    const userConversationRef = doc(db, 'userConversations', recipientId);
    const userConvDoc = await getDoc(userConversationRef);

    if (userConvDoc.exists()) {
      await updateDoc(userConversationRef, {
        [`conversations.${conversationId}.unreadCount`]: increment(1),
        [`conversations.${conversationId}.lastMessage`]: messageData.text,
        [`conversations.${conversationId}.lastMessageTime`]: serverTimestamp(),
      });
    }

    // Create notification
    await addDoc(collection(db, 'notifications'), {
      userId: recipientId,
      type: 'invoice_created',
      conversationId,
      senderId,
      senderName,
      senderCompanyName,
      itemType: conversationData.itemRef.itemType,
      itemTitle: conversationData.itemRef.title,
      message: `${senderName} from ${senderCompanyName} created a trade agreement for ${invoiceData.productName}`,
      timestamp: serverTimestamp(),
      isRead: false,
      contentType: 'invoice',
      invoiceId: invoiceData.id,
    });

    return { success: true, messageId: messageRef.id };
  } catch (error) {
    console.error('Error sending invoice message:', error);
    throw error;
  }
};

// Update the updateInvoiceStatusInChat function

export const updateInvoiceStatusInChat = async (
  conversationId: string,
  invoiceId: string,
  senderId: string,
  senderName: string,
  senderCompanyName: string,
  status: string,
  actionType: string,
  reason: string | null = null
) => {
  try {
    if (!conversationId) {
      throw new Error('Invalid conversation ID');
    }

    // Get the conversation
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationSnap = await getDoc(conversationRef);

    if (!conversationSnap.exists()) {
      throw new Error('Conversation does not exist');
    }

    // Find ALL invoice messages for this invoice
    const invoiceMessagesQuery = query(
      collection(db, 'conversations', conversationId, 'messages'),
      where('invoiceData.id', '==', invoiceId)
      // Also include messages with linkedInvoiceId for status updates
      // OR where('linkedInvoiceId', '==', invoiceId)
    );

    const messagesSnap = await getDocs(invoiceMessagesQuery);

    if (messagesSnap.empty) {
      console.warn(`No invoice message found for invoice ${invoiceId}`);
      // Create a new message for the status update
      return await createInvoiceStatusMessage(
        conversationId,
        invoiceId,
        senderId,
        senderName,
        senderCompanyName,
        status,
        actionType,
        reason
      );
    }

    const batch = writeBatch(db);

    // Update ALL invoice messages with the new status
    messagesSnap.forEach((docSnap) => {
      const messageData = docSnap.data();
      const messageRef = doc(db, 'conversations', conversationId, 'messages', docSnap.id);

      // Update the invoice status in the message data
      const updateData: Record<string, any> = {
        'invoiceData.status': status,
        'invoiceData.updatedAt': serverTimestamp(),
      };

      // Add action-specific data
      if (actionType === 'APPROVED') {
        updateData['invoiceData.approvedBy'] = senderId;
        updateData['invoiceData.approvedAt'] = serverTimestamp();
        updateData['invoiceData.approvals'] = arrayUnion({
          userId: senderId,
          userName: senderName,
          userCompany: senderCompanyName,
          timestamp: serverTimestamp(),
        });
      } else if (actionType === 'REJECTED') {
        updateData['invoiceData.rejectedBy'] = senderId;
        updateData['invoiceData.rejectedAt'] = serverTimestamp();
        updateData['invoiceData.rejectionReason'] = reason;
        updateData['invoiceData.approvals'] = []; // Clear approvals if rejected
      } else if (actionType === 'CANCELLED') {
        updateData['invoiceData.cancelledBy'] = senderId;
        updateData['invoiceData.cancelledAt'] = serverTimestamp();
        updateData['invoiceData.cancellationReason'] = reason;
      } else if (actionType === 'INSPECTION_ASSIGNED') {
      }

      batch.update(messageRef, updateData);
    });

    await batch.commit();

    // Also create a status update message
    await createInvoiceStatusMessage(
      conversationId,
      invoiceId,
      senderId,
      senderName,
      senderCompanyName,
      status,
      actionType,
      reason
    );

    // Update conversation last message
    const actionMessages: Record<string, string> = {
      approve: `✅ ${senderName} approved the trade agreement`,
      reject: `❌ ${senderName} rejected the trade agreement`,
      cancel: `⚠️ ${senderName} cancelled the trade agreement`,
    };

    const messageText = actionMessages[actionType] || `Trade agreement status updated to ${status}`;

    await updateDoc(conversationRef, {
      lastMessage: {
        text: messageText,
        timestamp: serverTimestamp(),
        senderId,
      },
      updatedAt: serverTimestamp(),
    });

    // Update user conversation for recipient
    const conversationData = conversationSnap.data();
    if (!conversationData) throw new Error('Conversation data not found');
    const recipientId = conversationData.participants.find((id: string) => id !== senderId);

    if (recipientId) {
      // TODO: Implement updateRecipientConversation and createInvoiceNotification functions
      // await updateRecipientConversation(conversationId, recipientId, messageText);

      // Create notification using existing createNotification function
      await createNotification(
        recipientId,
        senderId,
        senderName,
        senderCompanyName,
        conversationId,
        conversationData.itemRef,
        messageText,
        'invoice_status_update',
        'invoice'
      );
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating invoice status in chat:', error);
    throw error;
  }
};

// Helper function to create status update messages
const createInvoiceStatusMessage = async (
  conversationId: string,
  invoiceId: string,
  senderId: string,
  senderName: string,
  senderCompanyName: string,
  status: string,
  actionType: string,
  reason: string | null = null
) => {
  const actionText: Record<string, string> = {
    approve: ` ${senderName} approved the trade agreement`,
    reject: `${senderName} rejected the trade agreement${reason ? `: ${reason}` : ''}`,
    cancel: `${senderName} cancelled the trade agreement${reason ? `: ${reason}` : ''}`,
    update: `${senderName} updated the trade agreement status to ${status}`,
  };

  const messageData = {
    text: actionText[actionType] || `Trade agreement status updated to ${status}`,
    senderId,
    senderName,
    senderCompanyName,
    timestamp: serverTimestamp(),
    status: 'sent',
    isRead: false,
    attachments: [],
    contentType: 'invoice_status',
    invoiceAction: {
      invoiceId,
      action: actionType,
      status,
      performedBy: senderId,
      performedByName: senderName,
      reason,
      timestamp: serverTimestamp(),
    },
    // Link to the original invoice
    linkedInvoiceId: invoiceId,
  };

  const messageRef = await addDoc(collection(db, 'conversations', conversationId, 'messages'), messageData);

  // Mark as delivered
  setTimeout(async () => {
    await updateDoc(messageRef, {
      status: 'delivered',
      deliveredAt: serverTimestamp(),
    });
  }, 1000);

  return messageRef.id;
};

// In chat_service.js

export const updateInvoiceStatusInChats = async (
  conversationId: string,
  invoiceId: string,
  status: string, // 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED', 'INSPECTION_ASSIGNED', 'INSPECTION_COMPLETED', etc.
  actionData: any = {} // Additional data from server
) => {
  try {
    if (!conversationId) {
      console.warn('No conversationId provided for invoice status update');
      return { success: false, message: 'No conversation ID' };
    }

    // Get the conversation
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationSnap = await getDoc(conversationRef);

    if (!conversationSnap.exists()) {
      console.warn(`Conversation ${conversationId} does not exist`);
      return { success: false, message: 'Conversation not found' };
    }

    // Find ALL invoice messages for this specific invoice
    const invoiceMessagesQuery = query(
      collection(db, 'conversations', conversationId, 'messages'),
      where('invoiceData.id', '==', invoiceId)
    );

    const messagesSnap = await getDocs(invoiceMessagesQuery);

    if (messagesSnap.empty) {
      console.warn(`No invoice message found for invoice ${invoiceId} in conversation ${conversationId}`);
      return { success: false, message: 'No invoice message found in chat' };
    }

    const batch = writeBatch(db);

    // Update ALL invoice messages for this specific invoice with the new status
    messagesSnap.forEach((docSnap) => {
      const messageRef = doc(db, 'conversations', conversationId, 'messages', docSnap.id);

      // Basic status update
      const updateData: Record<string, any> = {
        'invoiceData.status': status,
        'invoiceData.updatedAt': serverTimestamp(),
      };

      // Add approvals array if provided
      if (actionData.approvals && Array.isArray(actionData.approvals)) {
        updateData['invoiceData.approvals'] = actionData.approvals;
      }

      // Add specific fields based on status
      switch (status) {
        case 'APPROVED':
          if (actionData.approvedBy) {
            updateData['invoiceData.approvedBy'] = actionData.approvedBy;
          }
          if (actionData.approvedAt) {
            updateData['invoiceData.approvedAt'] = actionData.approvedAt;
          }
          break;

        case 'REJECTED':
          if (actionData.rejectedBy) {
            updateData['invoiceData.rejectedBy'] = actionData.rejectedBy;
          }
          if (actionData.rejectedAt) {
            updateData['invoiceData.rejectedAt'] = actionData.rejectedAt;
          }
          if (actionData.rejectionReason) {
            updateData['invoiceData.rejectionReason'] = actionData.rejectionReason;
          }
          break;

        case 'CANCELLED':
          if (actionData.cancelledBy) {
            updateData['invoiceData.cancelledBy'] = actionData.cancelledBy;
          }
          if (actionData.cancelledAt) {
            updateData['invoiceData.cancelledAt'] = actionData.cancelledAt;
          }
          if (actionData.cancellationReason) {
            updateData['invoiceData.cancellationReason'] = actionData.cancellationReason;
          }
          break;

        case 'INSPECTION_ASSIGNED':
          if (actionData.inspectorId) {
            updateData['invoiceData.inspectorId'] = actionData.inspectorId;
          }
          if (actionData.inspectorName) {
            updateData['invoiceData.inspectorName'] = actionData.inspectorName;
          }
          if (actionData.inspectionAssignedAt) {
            updateData['invoiceData.inspectionAssignedAt'] = actionData.inspectionAssignedAt;
          }
          break;

        case 'INSPECTION_COMPLETED':
          if (actionData.inspectionCompletedAt) {
            updateData['invoiceData.inspectionCompletedAt'] = actionData.inspectionCompletedAt;
          }
          if (actionData.inspectionReportUrl) {
            updateData['invoiceData.inspectionReportUrl'] = actionData.inspectionReportUrl;
          }
          if (actionData.actualGradePercentage !== undefined) {
            updateData['invoiceData.actualGradePercentage'] = actionData.actualGradePercentage;
          }
          break;
      }

      batch.update(messageRef, updateData);
    });

    await batch.commit();

    // Update conversation timestamp (optional - keeps conversation at top of list)
    await updateDoc(conversationRef, {
      updatedAt: serverTimestamp(),
    });

    console.log(`Successfully updated status for invoice ${invoiceId} to ${status}`);
    return {
      success: true,
      updatedCount: messagesSnap.size,
      conversationId,
      invoiceId,
      status,
    };
  } catch (error) {
    console.error('Error updating invoice status in chat:', error);
    throw error;
  }
};

// Helper functions that match your server API responses
export const syncInvoiceStatusFromServer = async (invoiceData: any) => {
  try {
    // invoiceData should come from your server API response
    const { id, status, chatId, approvals, ...otherData } = invoiceData;

    if (!chatId) {
      console.warn(`Invoice ${id} has no chatId associated`);
      return { success: false, message: 'No chatId found' };
    }

    return await updateInvoiceStatusInChats(
      chatId, // This should be the conversationId
      id,
      status,
      {
        approvals, // Pass the entire approvals array
        ...otherData, // Pass any other relevant data
      }
    );
  } catch (error) {
    console.error('Error syncing invoice status from server:', error);
    throw error;
  }
};

// Specific action helpers
export const updateInvoiceApprovalInChat = async (invoiceData: any, userData: any) => {
  return await updateInvoiceStatusInChats(
    invoiceData.chatId,
    invoiceData.id,
    invoiceData.status, // Should be 'APPROVED' or 'REJECTED'
    {
      approvals: invoiceData.approvals, // Updated approvals array
      approvedBy: userData?.id,
      rejectedBy: userData?.id,
      ...(invoiceData.rejectionReason && { rejectionReason: invoiceData.rejectionReason }),
    }
  );
};

export { db, deleteConversation };

// const refreshUserNamesInConversations = async (userId, newName, newCompanyName) => {
//   try {
//     const userConvsQuery = query(collection(db, 'userConversations'));
//     const snap = await getDocs(userConvsQuery);
//     const batch = writeBatch(db);

//     let updatesCount = 0;

//     snap.docs.forEach((doc) => {
//       const convs = doc.data().conversations || {};

//       Object.keys(convs).forEach((convId) => {
//         if (convs[convId].otherUserId === userId) {
//           const updates = {};

//           // Always update name
//           updates[`conversations.${convId}.otherUserName`] = newName;

//           // Only update company name if it's not null/undefined
//           if (newCompanyName !== null && newCompanyName !== undefined && newCompanyName !== 'null') {
//             updates[`conversations.${convId}.otherCompanyName`] = newCompanyName;
//           }

//           batch.update(doc.ref, updates);
//           updatesCount++;
//         }
//       });
//     });

//     if (updatesCount > 0) {
//       await batch.commit();
//       console.log(`✅ Updated ${updatesCount} conversation references`);
//     }
//   } catch (error) {
//     console.error('Error refreshing user names in conversations:', error);
//     throw error;
//   }
// };

// const refreshUserNamesInMessages = async (userId, newName, newCompanyName) => {
//   try {
//     const conversationsQuery = query(collection(db, 'conversations'), where('participants', 'array-contains', userId));

//     const conversationsSnap = await getDocs(conversationsQuery);
//     const updatePromises = [];

//     conversationsSnap.forEach((convDoc) => {
//       const messagesQuery = query(
//         collection(db, 'conversations', convDoc.id, 'messages'),
//         where('senderId', '==', userId)
//       );

//       updatePromises.push(
//         getDocs(messagesQuery).then((snap) => {
//           const batch = writeBatch(db);
//           let hasUpdates = false;

//           snap.docs.forEach((doc) => {
//             const updateData = {
//               senderName: newName,
//             };

//             // Only update company name if it's valid
//             if (newCompanyName !== null && newCompanyName !== undefined && newCompanyName !== 'null') {
//               updateData.senderCompanyName = newCompanyName;
//             }

//             batch.update(doc.ref, updateData);
//             hasUpdates = true;
//           });

//           if (hasUpdates) {
//             return batch.commit();
//           }
//           return Promise.resolve();
//         })
//       );
//     });

//     await Promise.all(updatePromises);
//     console.log(`✅ Updated messages for user ${userId}`);
//   } catch (error) {
//     console.error('Error refreshing user names in messages:', error);
//     throw error;
//   }
// };

// const refreshUserNamesInNotifications = async (userId, newName, newCompanyName) => {
//   try {
//     const notificationsQuery = query(collection(db, 'notifications'), where('senderId', '==', userId));

//     const snap = await getDocs(notificationsQuery);

//     if (snap.empty) {
//       console.log('No notifications to update');
//       return;
//     }

//     const batch = writeBatch(db);

//     snap.docs.forEach((doc) => {
//       const updateData = {
//         senderName: newName,
//       };

//       // Only update company name if it's valid
//       if (newCompanyName !== null && newCompanyName !== undefined && newCompanyName !== 'null') {
//         updateData.senderCompanyName = newCompanyName;
//       }

//       batch.update(doc.ref, updateData);
//     });

//     await batch.commit();
//     console.log(`✅ Updated ${snap.size} notifications`);
//   } catch (error) {
//     console.error('Error refreshing user names in notifications:', error);
//     throw error;
//   }
// };

// Get user's conversations with real-time updates
// getUserConversations: (userId, callback) => {
//   if (!userId) return null;

//   const userConversationsRef = doc(db, 'userConversations', userId);

//   return onSnapshot(userConversationsRef, (doc) => {
//     if (doc.exists()) {
//       const data = doc.data();
//       // Convert from object to array and sort by last message time
//       const conversations = Object.values(data.conversations || {})
//         .sort((a, b) => {
//           // Handle cases where timestamp might be missing
//           if (!a.lastMessageTime) return 1;
//           if (!b.lastMessageTime) return -1;

//           const timeA = a.lastMessageTime.toDate ? a.lastMessageTime.toDate() : a.lastMessageTime;
//           const timeB = b.lastMessageTime.toDate ? b.lastMessageTime.toDate() : b.lastMessageTime;

//           return timeB - timeA; // Sort by most recent first
//         });
//       callback(conversations);
//     } else {
//       callback([]);
//     }
//   });
/**
 * Trade Chat Service — Customer Frontend
 *
 * This service handles trade conversations from the buyer/supplier/inspector perspective.
 * Messages are routed to the Admin (Min-meg Trade Desk), NOT to the other party directly.
 *
 * Uses the `trade_rooms` Firebase collection with Hub-and-Spoke architecture.
 */

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
    text: string,
    attachments: any[] = []
  ): Promise<string> {
    try {
      const messagesRef = collection(db, 'trade_rooms', tradeId, 'threads', spoke, 'messages');

      const messageData = {
        sender_id: senderId,
        sender_role: senderRole,
        sender_display: senderName, // Users show their real name
        sender_name: senderName,
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

      // Update room's updated_at
      await updateDoc(doc(db, 'trade_rooms', tradeId), {
        updated_at: serverTimestamp(),
      });

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
      // Remove sender_id from query to avoid composite index requirement
      const q = query(messagesRef, where('isRead', '==', false));
      const snapshot = await getDocs(q);

      const batch = writeBatch(db);
      let hasUpdates = false;

      snapshot.docs.forEach((d) => {
        // Filter sender_id client-side
        if (d.data().sender_id !== userId) {
          batch.update(d.ref, { isRead: true, readAt: serverTimestamp() });
          hasUpdates = true;
        }
      });

      if (hasUpdates) {
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
   * Get all trade rooms for a user based on their role (real-time).
   */
  getUserTradeRooms(userId: string, userRole: string, callback: (rooms: any[]) => void) {
    if (!userId) return null;

    const roomsRef = collection(db, 'trade_rooms');
    let q;

    // Removed orderBy('updated_at', 'desc') to avoid composite index requirement
    if (userRole === 'buyer') {
      q = query(roomsRef, where('buyer_id', '==', userId));
    } else if (userRole === 'supplier') {
      q = query(roomsRef, where('supplier_id', '==', userId));
    } else if (userRole === 'inspector') {
      q = query(roomsRef, where('inspector_id', '==', userId));
    } else {
      // Fallback for admin or other roles if used in frontend
      return null;
    }

    return onSnapshot(q, (snapshot) => {
      const rooms = snapshot.docs.map((d) => ({
        conversationId: d.id,
        ...d.data(),
        itemType: 'trade',
        // Map fields to match standard conversation interface
        itemTitle: d.data().mineral_tag?.replace(/_/g, ' ') || 'Trade Inquiry',
        otherUserName: 'Min-meg Trade Desk',
        otherCompanyName: 'Platform Admin',
        lastMessageTime: d.data().updated_at?.toDate(),
      }));

      // Sort client-side
      rooms.sort((a, b) => {
        const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
        const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
        return timeB - timeA;
      });

      callback(rooms);
    });
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
};
