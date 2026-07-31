/**
 * Trade Chat Service
 * This service handles trade conversations from the buyer/supplier/inspector perspective.
 * Messages are routed to the Admin (Min-meg Trade Desk), NOT to the other party directly.
 *
 * Uses the `trade_rooms` Firebase collection with Hub-and-Spoke architecture.
 */

import { db, storage } from "@/lib/firebase";
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
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { chatNotificationService } from "./chat_notif_service";
import { logger } from "@/utils/logger";

// ─── Types ────────────────────────────────────────────────────────

export type UserSpokeType =
  | "admin_buyer"
  | "admin_supplier"
  | "admin_inspector";

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
  sender_company_name?: string;
  text: string;
  timestamp: any;
  type: "text" | "system" | "document" | "attachment" | "trade_document" | "trade_document_update" | string;
  attachments?: any[];
  isRead?: boolean;
}

// ─── Service ──────────────────────────────────────────────────────

export const customerTradeChatService = {
  /**
   * Internal helper to ensure IDs are unhyphenated for consistent Firestore paths
   */
  _sanitizeId(id: string): string {
    return String(id || "");
  },

  /**
   * Create a new trade room when an inquiry is created
   */
  async createTradeRoom(
    inquiryId: string,
    metadata: Omit<TradeRoomMetadata, "created_at" | "updated_at">,
  ): Promise<string> {
    const id = this._sanitizeId(inquiryId);
    try {
      const roomRef = doc(db, "trade_rooms", id);
      const existing = await getDoc(roomRef);

      if (existing.exists()) {
        return id;
      }

      await setDoc(roomRef, {
        ...metadata,
        inquiry_id: id,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      // Initialize spoke thread metadata docs
      const spokes: UserSpokeType[] = [
        "admin_buyer",
        "admin_supplier",
        "admin_inspector",
      ];
      for (const spoke of spokes) {
        await setDoc(doc(db, "trade_rooms", id, "threads", spoke), {
          created_at: serverTimestamp(),
          last_message: null,
          message_count: 0,
        });
      }

      return id;
    } catch (error) {
      console.error("Error creating trade room:", error);
      throw error;
    }
  },

  /**
   * Determine which spoke thread a user should access based on their global role.
   * @deprecated Use getSpokeByContext for trade-specific spoke resolution.
   */
  getUserSpoke(userRole: string): UserSpokeType {
    switch (userRole) {
      case "buyer":
        return "admin_buyer";
      case "supplier":
        return "admin_supplier";
      case "inspector":
        return "admin_inspector";
      default:
        return "admin_buyer";
    }
  },

  /**
   * Compare two IDs flexibly, ignoring hyphens and case differences
   */
  isSameId(id1?: string | null, id2?: string | null): boolean {
    if (!id1 || !id2) return false;
    const clean1 = String(id1).replace(/-/g, '').toLowerCase();
    const clean2 = String(id2).replace(/-/g, '').toLowerCase();
    return clean1 === clean2;
  },

  /**
   * Determine which spoke thread a user should access based on their contextual
   * role in a specific trade (Inquirer = admin_buyer, Owner = admin_supplier).
   * This is the correct method to use for trade chat operations.
   */



  getSpokeByContext(userId: string, tradeMetadata: any, activeInquiry?: any, userRole?: string): UserSpokeType | null {
    if (this.isSameId(userId, tradeMetadata?.inspector_id) || this.isSameId(userId, tradeMetadata?.matched_inspector_id)) {
      return "admin_inspector";
    }

    if (
      this.isSameId(userId, tradeMetadata?.supplier_id) ||
      this.isSameId(userId, tradeMetadata?.matched_supplier_id) ||
      this.isSameId(userId, activeInquiry?.supplier_id)
    ) {
      return "admin_supplier";
    }

    if (
      this.isSameId(userId, tradeMetadata?.buyer_id) ||
      this.isSameId(userId, tradeMetadata?.user_id) ||
      this.isSameId(userId, activeInquiry?.buyer_id)
    ) {
      return "admin_buyer";
    }

    // 2. Access Bridging for Team Members (Participants list check)
    const participants = tradeMetadata?.participant_ids || [];
    if (participants.some((pId: string) => this.isSameId(userId, pId))) {
      return "admin_supplier";
    }

    // 3. RFQ context fallback: If room is an RFQ, non-buyer user is interacting as a supplier (admin_supplier)
    const entityType = tradeMetadata?.entity_type || tradeMetadata?.type;
    if (entityType === "rfq") {
      if (!this.isSameId(userId, tradeMetadata?.buyer_id)) {
        return "admin_supplier";
      }
      return "admin_buyer";
    }

    // 4. Role-based fallback
    if (userRole === "supplier" || userRole === "both" || userRole === "buyer_supplier") {
      return "admin_supplier";
    }
    if (userRole === "inspector") {
      return "admin_inspector";
    }

    return "admin_buyer";
  },

  /**
   * Listen to all inquiries (trades) within a trade room (real-time).
   * Used for generating the tabs in the UI.
   *
   * Filtering logic:
   * - RFQ rooms + supplier role → only show trades where supplier_id matches
   * - All other rooms (product, business) → show all trades (1-to-1, no privacy concern)
   * - Buyer role → always sees all trades in any room type
   */
  getRoomInquiries(
    tradeId: string,
    userId: string,
    userRole: string,
    callback: (inquiries: any[]) => void,
    errorCallback?: (error: any) => void,
  ) {
    const id = this._sanitizeId(tradeId);
    const uId = this._sanitizeId(userId);
    const tradesRef = collection(db, "trade_rooms", id, "trades");

    // Always fetch ALL trades (no query-level filter)
    const q = query(tradesRef, orderBy("created_at", "desc"));

    // We must know the room's entity_type BEFORE processing snapshots
    // to correctly filter RFQ rooms for suppliers.
    let unsubSnapshot: (() => void) | null = null;

    getDoc(doc(db, "trade_rooms", id)).then((roomDoc) => {
      const roomEntityType = roomDoc.exists()
        ? roomDoc.data()?.entity_type || null
        : null;

      unsubSnapshot = onSnapshot(
        q,
        (snapshot) => {
          let inquiries = snapshot.docs
            .map((d) => ({
              id: d.id,
              ...d.data(),
            }))
            .filter((i: any) => i.isHiddenFromUsers !== true);

          // Client-side filter: ONLY for RFQ rooms when acting as supplier
          const isSupplierRole = userRole === "supplier" || userRole === "buyer_supplier" || userRole === "both";
          if (roomEntityType === "rfq" && isSupplierRole) {
            inquiries = inquiries.filter(
              (trade: any) =>
                this.isSameId(trade.supplier_id, userId) ||
                this.isSameId(trade.matched_supplier_id, userId) ||
                this.isSameId(trade.buyer_id, userId) ||
                this.isSameId(trade.user_id, userId)
            );
          }

          // Client-side filter: Inspector role (only show assigned cycles)
          if (userRole === "inspector") {
            inquiries = inquiries.filter(
              (trade: any) =>
                this.isSameId(trade.inspector_id, userId) ||
                this.isSameId(trade.matched_inspector_id, userId)
            );
          }
          // For product/business rooms OR buyer role → no filtering, show all

          callback(inquiries);
        },
        (error) => {
          console.error("[TradeChat] getRoomInquiries snapshot error:", error);
          if (errorCallback) errorCallback(error);
        },
      );
    });

    // Return cleanup function
    return () => {
      if (unsubSnapshot) unsubSnapshot();
    };
  },

  /**
   * Get messages for a user's spoke (real-time)
   */
  getSpokeMessages(
    tradeId: string,
    inquiryId: string,
    spoke: UserSpokeType,
    callback: (messages: TradeMessage[]) => void,
    errorCallback?: (error: any) => void,
  ) {
    if (!tradeId || !inquiryId || !spoke) {
      console.warn("getSpokeMessages: Missing tradeId, inquiryId, or spoke", {
        tradeId,
        inquiryId,
        spoke,
      });
      return () => { };
    }
    const id = this._sanitizeId(tradeId);
    const messagesRef = collection(
      db,
      "trade_rooms",
      id,
      "trades",
      this._sanitizeId(inquiryId),
      "threads",
      spoke,
      "messages",
    );
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    return onSnapshot(
      q,
      (snapshot) => {
        const messages: TradeMessage[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as TradeMessage[];

        callback(messages);
      },
      (error) => {
        console.error("[TradeChat] getSpokeMessages snapshot error:", error);
        if (errorCallback) errorCallback(error);
      },
    );
  },

  /**
   * Send a message to the admin (via the user's spoke)
   */
  async sendMessage(
    tradeId: string,
    inquiryId: string,
    spoke: UserSpokeType,
    senderId: string,
    senderRole: string,
    senderName: string,
    senderCompanyName: string,
    text: string,
    attachments: any[] = [],
  ): Promise<string> {
    const id = this._sanitizeId(tradeId);
    const inqId = this._sanitizeId(inquiryId);
    const sId = this._sanitizeId(senderId);

    if (!tradeId || !inquiryId || !spoke || !senderId) {
      console.error("sendMessage: Missing required parameters", {
        tradeId,
        inquiryId,
        spoke,
        senderId,
      });
      throw new Error("Missing required parameters for sendMessage");
    }

    try {
      const messagesRef = collection(
        db,
        "trade_rooms",
        id,
        "trades",
        inqId,
        "threads",
        spoke,
        "messages",
      );

      const messageData = {
        sender_id: sId,
        sender_role: senderRole,
        sender_display: senderName,
        sender_name: senderName,
        sender_company_name: senderCompanyName,
        text,
        timestamp: serverTimestamp(),
        type: attachments.length > 0 ? "attachment" : "text",
        attachments: attachments || [],
        isRead: false,
      };

      const msgRef = await addDoc(messagesRef, messageData);

      // Update thread metadata
      await updateDoc(
        doc(db, "trade_rooms", id, "trades", inqId, "threads", spoke),
        {
          last_message: {
            text: text || (attachments.length > 0 ? "📎 Attachment" : ""),
            sender_display: senderName,
            timestamp: serverTimestamp(),
          },
          message_count: increment(1),
        },
      );

      // Update room's updated_at and summary
      await updateDoc(doc(db, "trade_rooms", id), {
        updated_at: serverTimestamp(),
        last_active_spoke: spoke,
        last_message: {
          text: text || (attachments.length > 0 ? "📎 Attachment" : ""),
          sender_display: senderName,
          timestamp: serverTimestamp(),
        },
      });

      // Update specific trade's updated_at
      await updateDoc(doc(db, "trade_rooms", id, "trades", inqId), {
        updated_at: serverTimestamp(),
      });

      // Trigger notification for Admin
      // In Hub-And-Spoke, messages from users go to 'admin'
      // We'll notify GLOBAL_ADMIN for the bell and any specific assigned admin if we can find them
      const roomDoc = await getDoc(doc(db, "trade_rooms", id));
      const roomData = roomDoc.data();

      if (roomData) {
        // Determine recipient: assigned admin or GLOBAL_ADMIN
        const recipientId = roomData.assigned_admin_id || "GLOBAL_ADMIN";

        await createNotification(
          recipientId,
          String(senderId),
          senderName,
          senderCompanyName,
          id,
          {
            itemType: roomData.entity_type || "product",
            itemId: String(roomData.inquiry_id || id),
            title:
              roomData.item_name ||
              roomData.mineral_tag?.replace(/_/g, " ") ||
              "Trade Inquiry",
          },
          text || (attachments.length > 0 ? "📎 Attachment" : ""),
          "new_message",
          attachments.length > 0 ? "file" : "text",
        );
      }

      return msgRef.id;
    } catch (error) {
      console.error("Error sending trade message:", error);
      throw error;
    }
  },

  /**
   * Mark messages as read
   */
  async markSpokeAsRead(
    tradeId: string,
    inquiryId: string,
    spoke: UserSpokeType,
    userId: string,
  ): Promise<void> {
    if (!tradeId || !inquiryId || !spoke || !userId) {
      console.warn("markSpokeAsRead: Missing required parameters", {
        tradeId,
        inquiryId,
        spoke,
        userId,
      });
      return;
    }
    const id = this._sanitizeId(tradeId);
    const inqId = this._sanitizeId(inquiryId);
    const uId = this._sanitizeId(userId);
    try {
      const messagesRef = collection(
        db,
        "trade_rooms",
        id,
        "trades",
        inqId,
        "threads",
        spoke,
        "messages",
      );
      const q = query(
        messagesRef,
        where("isRead", "==", false)
      );
      const snapshot = await getDocs(q);

      const batch = writeBatch(db);
      let hasUpdates = false;
      snapshot.docs.forEach((d) => {
        if (d.data()?.sender_id !== uId) {
          batch.update(d.ref, { isRead: true, readAt: serverTimestamp() });
          hasUpdates = true;
        }
      });

      if (hasUpdates) {
        await batch.commit();
      }
    } catch (error) {
      console.error("Error marking spoke as read:", error);
    }
  },

  /**
   * Upload an attachment
   */
  async uploadAttachment(
    file: File,
    tradeId: string,
    inquiryId: string,
    spoke: UserSpokeType,
  ): Promise<{ url: string; name: string; type: string }> {
    if (!tradeId || !inquiryId || !spoke) {
      throw new Error("uploadAttachment: Missing tradeId, inquiryId, or spoke");
    }
    const id = this._sanitizeId(tradeId);
    const inqId = this._sanitizeId(inquiryId);
    try {
      const filePath = `trade_rooms/${id}/${inqId}/${spoke}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, filePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          null,
          (error) => reject(error),
          async () => {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

            // Robust type detection
            let type = "file";
            const mimeType = file.type.toLowerCase();
            const fileName = file.name.toLowerCase();

            if (
              mimeType.startsWith("image/") ||
              /\.(jpg|jpeg|png|gif|webp|heic|jfif)$/i.test(fileName)
            ) {
              type = "image";
            } else if (
              mimeType.startsWith("video/") ||
              /\.(mp4|webm|ogg|mov)$/i.test(fileName)
            ) {
              type = "video";
            }

            resolve({
              url: downloadUrl,
              name: file.name,
              type,
            });
          },
        );
      });
    } catch (error) {
      console.error("Error uploading trade attachment:", error);
      throw error;
    }
  },

  /**
   * Get trade room metadata
   */
  async getTradeRoomMetadata(tradeId: string): Promise<any | null> {
    const id = this._sanitizeId(tradeId);
    try {
      const roomDoc = await getDoc(doc(db, "trade_rooms", id));
      if (!roomDoc.exists()) return null;
      return roomDoc.data();
    } catch (error) {
      console.error("Error getting trade room:", error);
      return null;
    }
  },

  /**
   * Get trade rooms for a specific user formatted as Conversations for the Sidebar.
   * Queries rooms where user is buyer_id OR supplier_id (contextual, not role-based).
   */
  getUserTradeRooms(
    userId: string,
    role: string,
    callback: (conversations: any[]) => void,
    errorCallback?: (error: any) => void,
  ) {
    const cleanUserId = String(userId || "");
    const unhyphenatedId = cleanUserId.replace(/-/g, "");
    const hyphenatedId = cleanUserId.includes("-")
      ? cleanUserId
      : `${cleanUserId.slice(0, 8)}-${cleanUserId.slice(8, 12)}-${cleanUserId.slice(12, 16)}-${cleanUserId.slice(16, 20)}-${cleanUserId.slice(20)}`;
    const targetUserIds = Array.from(new Set([cleanUserId, unhyphenatedId, hyphenatedId])).filter(Boolean);

    // Query for rooms where user is buyer (matches both hyphenated and unhyphenated IDs)
    const buyerQuery = query(
      collection(db, "trade_rooms"),
      where("buyer_id", "in", targetUserIds),
    );
    // Query for rooms where user is supplier (matches both hyphenated and unhyphenated IDs)
    const supplierQuery = query(
      collection(db, "trade_rooms"),
      where("supplier_id", "in", targetUserIds),
    );
    // Query for rooms where user is inspector (matches both hyphenated and unhyphenated IDs)
    const inspectorQuery = query(
      collection(db, "trade_rooms"),
      where("inspector_id", "in", targetUserIds),
    );
    // Query for rooms where user is manager
    const managerQuery = query(
      collection(db, "trade_rooms"),
      where("assigned_manager_id", "in", targetUserIds),
    );
    // Query for rooms where user is admin
    const adminQuery = query(
      collection(db, "trade_rooms"),
      where("assigned_admin_id", "in", targetUserIds),
    );
    // Query for rooms where user is in the participant list (Multi-RFQ support)
    const participantQuery = query(
      collection(db, "trade_rooms"),
      where("participant_ids", "array-contains", cleanUserId),
    );

    let buyerRooms: any[] = [];
    let supplierRooms: any[] = [];
    let inspectorRooms: any[] = [];
    let managerRooms: any[] = [];
    let adminRooms: any[] = [];
    let participantRooms: any[] = [];
    let buyerDone = false;
    let supplierDone = false;
    let inspectorDone = false;
    let managerDone = false;
    let adminDone = false;
    let participantDone = false;

    const processRooms = async (snapshot: any) => {
      logger.info(`[TradeChat] Processing ${snapshot.size} room documents...`);
      return await Promise.all(
        snapshot.docs.map(async (docSnap: any) => {
          try {
            const data = docSnap.data();
            if (data.isHiddenFromUsers === true) {
              logger.info(
                `[TradeChat] Room ${docSnap.id} is hidden from users. Skipping.`,
              );
              return null;
            }

            const tradeId = docSnap.id;
            const spoke = this.getSpokeByContext(cleanUserId, data);
            if (!spoke) {
              logger.warn(
                `[TradeChat] Access denied for room ${tradeId}. Skipping.`,
              );
              return null;
            }

            // Check if this user has been computed as having 0 visible trade cycles
            // (set by backend recomputeHiddenUsers when admin hides/shows trade cycles)
            if (Array.isArray(data.hidden_for_user_ids) && data.hidden_for_user_ids.includes(cleanUserId)) {
              logger.info(
                `[TradeChat] Room ${tradeId} has user ${cleanUserId} in hidden_for_user_ids. Hiding room from sidebar.`
              );
              return null;
            }

            const threadDoc = await getDoc(
              doc(db, "trade_rooms", tradeId, "threads", spoke),
            );
            const threadData = threadDoc.exists()
              ? threadDoc.data()
              : { last_message: null, message_count: 0 };

            // 24-hour Auto-Hide logic for rejected threads
            if (threadData.status === "rejected" && threadData.rejected_at) {
              const rejectedAt =
                threadData.rejected_at.toDate?.() ||
                new Date(threadData.rejected_at);
              const now = new Date();
              const diffHours =
                (now.getTime() - rejectedAt.getTime()) / (1000 * 60 * 60);

              if (diffHours > 24) {
                logger.info(
                  `[TradeChat] Room ${tradeId} auto-hidden after 24h grace period.`,
                );
                return null;
              }
            }

            const lastMsgTime =
              threadData.last_message?.timestamp?.toDate?.() ||
              data.updated_at?.toDate?.() ||
              data.created_at?.toDate?.() ||
              new Date();

            const buyerIdStr = String(data.buyer_id || data.user_id || "");
            const supplierIdStr = String(data.supplier_id || data.matched_supplier_id || "");
            const inspectorIdStr = String(data.inspector_id || data.matched_inspector_id || "");

            const isRoomBuyer = buyerIdStr === cleanUserId;
            const isRoomSupplier = supplierIdStr === cleanUserId;
            const isInspector = inspectorIdStr === cleanUserId;

            const buyerCode = data.buyer_code || "B-1";
            const supplierCode = data.supplier_code || "S-1";
            const buyerAlias = data.buyer_alias || (data.buyer_code ? `Buyer #${data.buyer_code.replace(/[^0-9]/g, "")}` : "Buyer #1");
            const supplierAlias = data.supplier_alias || (data.supplier_code ? `Supplier #${data.supplier_code.replace(/[^0-9]/g, "")}` : "Supplier #1");

            const inspectorCode = data.inspector_code || "I-1";
            const inspectorAlias = data.inspector_alias || "Inspection #1";

            let aliasText = "";
            let avatarText = "MD";

            if (isRoomSupplier) {
              // I am the Supplier in this room -> My counterpart is Buyer #1
              aliasText = buyerAlias;
              avatarText = buyerCode;
            } else if (isRoomBuyer) {
              // I am the Buyer in this room -> My counterpart is Supplier #1
              aliasText = supplierAlias;
              avatarText = supplierCode;
            } else if (isInspector) {
              // Inspector inspecting this trade -> I-1, I-2...
              aliasText = inspectorAlias;
              avatarText = inspectorCode;
            }

            const isDualRole = role === "buyer_supplier" || role === "both";
            const roleTag = isDualRole ? (isRoomBuyer ? "PURCHASE" : isRoomSupplier ? "SALES" : "") : "";

            return {
              conversationId: tradeId,
              conversationType: "trade",
              itemType: data.entity_type || "product",
              itemId: data.inquiry_id || tradeId,
              itemTitle:
                data.item_name ||
                data.mineral_tag?.replace(/_/g, " ") ||
                "Trade Inquiry",
              otherUserId: "admin",
              otherUserName: "Min-meg Trade Desk",
              otherCompanyName: "Platform Admin",
              tradeRef: data.trade_ref || `TRM-${tradeId}`,
              aliasText: aliasText,
              roleTag: roleTag,
              avatarText: avatarText,
              lastMessageTime: lastMsgTime,
              unreadCount: 0,
              userSpoke: spoke,
              metadata: data,
            };
          } catch (err) {
            console.error(`[TradeChat] Error loading room ${docSnap.id}:`, err);
            return null;
          }
        }),
      );
    };

    const emitMergedResults = () => {
      if (
        !buyerDone ||
        !supplierDone ||
        !inspectorDone ||
        !managerDone ||
        !adminDone ||
        !participantDone
      ) {
        return;
      }

      const allRooms = [
        ...buyerRooms,
        ...supplierRooms,
        ...inspectorRooms,
        ...managerRooms,
        ...adminRooms,
        ...participantRooms,
      ];
      const seen = new Set();
      const validRooms = allRooms.filter((r) => {
        if (!r || seen.has(r.conversationId)) return false;
        seen.add(r.conversationId);
        return true;
      });

      validRooms.sort((a, b) => {
        const timeA = a.lastMessageTime ? a.lastMessageTime.getTime() : 0;
        const timeB = b.lastMessageTime ? b.lastMessageTime.getTime() : 0;
        return timeB - timeA;
      });

      callback(validRooms);
    };

    const unsubBuyer = onSnapshot(
      buyerQuery,
      async (snapshot) => {
        buyerRooms = await processRooms(snapshot);
        buyerDone = true;
        emitMergedResults();
      },
      (error) => {
        console.error("[TradeChat] Buyer snapshot error:", error);
        if (errorCallback) errorCallback(error);
        buyerDone = true;
        emitMergedResults();
      },
    );

    const unsubSupplier = onSnapshot(
      supplierQuery,
      async (snapshot) => {
        supplierRooms = await processRooms(snapshot);
        supplierDone = true;
        emitMergedResults();
      },
      (error) => {
        console.error("[TradeChat] Supplier snapshot error:", error);
        if (errorCallback) errorCallback(error);
        supplierDone = true;
        emitMergedResults();
      },
    );

    const unsubInspector = onSnapshot(
      inspectorQuery,
      async (snapshot) => {
        inspectorRooms = await processRooms(snapshot);
        inspectorDone = true;
        emitMergedResults();
      },
      (error) => {
        console.error("[TradeChat] Inspector snapshot error:", error);
        if (errorCallback) errorCallback(error);
        inspectorDone = true;
        emitMergedResults();
      },
    );

    const unsubManager = onSnapshot(
      managerQuery,
      async (snapshot) => {
        managerRooms = await processRooms(snapshot);
        managerDone = true;
        emitMergedResults();
      },
      (error) => {
        console.error("[TradeChat] Manager snapshot error:", error);
        if (errorCallback) errorCallback(error);
        managerDone = true;
        emitMergedResults();
      },
    );

    const unsubAdmin = onSnapshot(
      adminQuery,
      async (snapshot) => {
        adminRooms = await processRooms(snapshot);
        adminDone = true;
        emitMergedResults();
      },
      (error) => {
        console.error("[TradeChat] Admin snapshot error:", error);
        if (errorCallback) errorCallback(error);
        adminDone = true;
        emitMergedResults();
      },
    );

    const unsubParticipant = onSnapshot(
      participantQuery,
      async (snapshot) => {
        participantRooms = await processRooms(snapshot);
        participantDone = true;
        emitMergedResults();
      },
      (error) => {
        console.error("[TradeChat] Participant snapshot error:", error);
        if (errorCallback) errorCallback(error);
        participantDone = true;
        emitMergedResults();
      },
    );

    return () => {
      unsubBuyer();
      unsubSupplier();
      unsubInspector();
      unsubManager();
      unsubAdmin();
      unsubParticipant();
    };
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
  contentType?: string,
) => {
  const uId = String(userId || "");
  const sId = String(senderId || "");
  try {
    await addDoc(collection(db, "notifications"), {
      userId: uId,
      type,
      conversationId: String(conversationId || ""),
      senderId: sId,
      senderName,
      senderCompanyName,
      itemType: itemRef.itemType,
      itemTitle: itemRef.title,
      itemId: itemRef.itemId,
      message: message.substring(0, 100),
      timestamp: serverTimestamp(),
      isRead: false,
      contentType: contentType || "text",
    });

    // Skip email for GLOBAL_ADMIN as it might not have a valid email record linked to UUID logic
    if (uId === "GLOBAL_ADMIN") return;

    const userRef = doc(db, "users", uId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      await chatNotificationService.sendMessageNotification({
        recipientId: uId,
        senderName,
        senderCompanyName,
        messageText: message,
        conversationId,
        itemTitle: itemRef.title,
        fullName: userData.displayName || "User",
        contentType: contentType || "text",
      });
    }
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};
