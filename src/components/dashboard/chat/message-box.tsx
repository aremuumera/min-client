import * as React from 'react';
import { formatFileSize } from '@/utils/helper';
import { IconButton } from '@/components/ui/icon-button';
import { Link } from '@/components/ui/link';
import { Menu, MenuItem } from '@/components/ui/menu';
import { Modal } from '@/components/ui/modal';
import { Avatar } from '@/components/ui/avatar';
import { Box } from '@/components/ui/box';
import { Card } from '@/components/ui/card';

import { Stack } from '@/components/ui/stack';
import { Typography } from '@/components/ui/typography';
import { DotsThreeCircleVertical } from '@phosphor-icons/react';
import { PaperclipIcon } from 'lucide-react';
import { useParams } from 'next/navigation';

import { usePathname } from '@/hooks/use-pathname';

import { InvoiceMessageCard } from '../invoice/message_card';
import { TradeDocumentCard } from './trade-document-card';
import { SignatureWidget } from './signature-widget';
import { ChatContext, Message } from '@/providers/chat-provider';
import dayjs from 'dayjs';
import { useAppSelector } from '@/redux';
import { useSignDocumentMutation } from '@/redux/features/doc-hub/doc_hub_api';

// Import utilities from shared utils
import { generateTextAvatar, stringToColor } from '@/utils/chat-utils';

export function MessageBox({ message }: { message: Message }) {
  const { user } = useAppSelector((state) => state.auth);
  // Support both peer-to-peer (senderId) and trade (sender_id) alignments
  const senderId = message?.senderId || message?.sender_id;
  const position = senderId === user?.id ? 'right' : 'left';

  // Use robust naming for avatar generation
  const displayName = message?.senderName || message?.sender_display || 'User';
  const avatarBgColor = stringToColor(displayName);
  const { deleteAttachment, markMessageAsDelivered, markMessageAsRead, sendMessage, setActiveTab } = React.useContext(ChatContext) || {};

  // State for modal
  const [selectedMedia, setSelectedMedia] = React.useState<{ url: string, type: 'image' | 'video' } | null>(null);
  const [showSignature, setShowSignature] = React.useState(false);
  const [signingDocId, setSigningDocId] = React.useState<string | null>(null);
  const params = useParams();
  const threadId = params?.threadId as string;

  const [signDocument, { isLoading: isSigning }] = useSignDocumentMutation?.() || [() => { }, { isLoading: false }];

  const handleMediaClick = (attachment: any) => {
    if (attachment.type === 'image' || attachment.type === 'video') {
      setSelectedMedia({ url: attachment.url, type: attachment.type });
    }
  };

  const handleCloseModal = () => {
    setSelectedMedia(null);
  };

  const handleDeleteAttachment = async (attachment: any) => {
    try {
      if (!attachment) return;

      // Find the attachment index
      const attachmentIndex = message.attachments.findIndex(
        (a: any) => a.url === attachment.url || (a.type === 'deleted' && a.originalName === attachment.name)
      );

      if (attachmentIndex === -1) {
        console.warn('Attachment not found in message');
        return;
      }

      await deleteAttachment(
        threadId,
        message.id,
        attachmentIndex
      );
    } catch (error) {
      console.error('Failed to delete attachment:', error);
    }
  };

  // // Track message status when component mounts
  // React.useEffect(() => {
  //   if (message && position === 'right') {
  //     // If message is sent by current user and status is 'sent'
  //     if (message.status === 'sent') {
  //       // Simulate delivery after a short delay
  //       const deliveryTimer = setTimeout(() => {
  //         markMessageAsDelivered(message.conversationId, message.id);
  //       }, 1000);

  //       return () => clearTimeout(deliveryTimer);
  //     }
  //   }
  // }, [message, position, markMessageAsDelivered]);

  // Render status indicators
  const renderStatusIndicator = () => {
    if (position !== 'right') return null;

    let statusText = '';
    let statusColor = 'text.secondary';

    if (message.status === 'sent') {
      statusText = '✓ Sent';
    } else if (message.status === 'delivered') {
      statusText = '✓✓ Delivered';
    } else if (message.isRead) {
      statusText = '✓✓ Read';
      statusColor = 'primary.main';
    }

    return (
      <Typography
        variant="caption"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.125rem',
          marginLeft: '0.25rem',
          color: message.isRead ? '#10b981' : '#666'
        }}
      >
        {statusText}
      </Typography>
    );
  };


  // Check for Cycle Start System Divider
  if (message.meta?.type === 'cycle_start') {
    return (
      <Box
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          margin: '2rem 0',
          position: 'relative'
        }}
      >
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-gray-50 px-4 py-1 text-xs font-bold text-gray-500 uppercase tracking-widest border border-gray-200 rounded-full shadow-sm">
            {message.text}
          </span>
        </div>
      </Box>
    );
  }

  // Check if there is an invoice message
  if (message.contentType === 'invoice' && message.invoiceData) {
    return (
      <Box
        style={{
          alignItems: position === 'right' ? 'flex-end' : 'flex-start',
          flex: '0 0 auto',
          display: 'flex',
          marginBottom: '0.5rem',
          width: '100%',
        }}

      >
        <Stack
          direction={position === 'right' ? 'row-reverse' : 'row'}
          spacing={2}
          style={{
            alignItems: 'flex-start',
            maxWidth: '500px',
            marginLeft: position === 'right' ? 'auto' : 0,
            marginRight: position === 'left' ? 'auto' : 0,
            width: '100%',
          }}
        >
          <Avatar
            className="w-8 h-8 text-white text-sm"
            style={{ backgroundColor: avatarBgColor }}
          >
            {generateTextAvatar(displayName)}
          </Avatar>

          <Stack spacing={1} style={{ flex: '1 1 auto' }}>
            <InvoiceMessageCard invoice={message.invoiceData} position={position} />

            {/* Timestamp */}
            <Box
              style={{
                display: 'flex',
                justifyContent: position === 'right' ? 'flex-end' : 'flex-start',
                paddingLeft: '0.25rem',
                paddingRight: '0.25rem',
              }}
            >
              <Typography style={{ color: '#666' }} variant="caption">
                {message.timestamp
                  ? dayjs(message.timestamp?.toDate ? message.timestamp.toDate() : message.timestamp).fromNow()
                  : 'Just now'}
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Box>
    );
  }

  // Check if there is a trade document message
  if (message.contentType === 'trade_document' && message.documentData) {
    return (
      <>
        <Box
          style={{
            alignItems: position === 'right' ? 'flex-end' : 'flex-start',
            flex: '0 0 auto',
            display: 'flex',
            marginBottom: '0.5rem',
            width: '100%',
          }}
        >
          <Stack
            direction={position === 'right' ? 'row-reverse' : 'row'}
            spacing={2}
            style={{
              alignItems: 'flex-start',
              maxWidth: '500px',
              marginLeft: position === 'right' ? 'auto' : 0,
              marginRight: position === 'left' ? 'auto' : 0,
              width: '100%',
            }}
          >
            <Avatar
              className="w-8 h-8 text-white text-sm"
              style={{ backgroundColor: avatarBgColor }}
            >
              {generateTextAvatar(displayName)}
            </Avatar>

            <Stack spacing={1} style={{ flex: '1 1 auto' }}>
              <TradeDocumentCard
                document={message.documentData}
                position={position}
                onSign={(docId) => {
                  setSigningDocId(docId);
                  setShowSignature(true);
                  // Ensure widget is in sign/accept mode
                }}
                onFlag={(docId) => {
                  setSigningDocId(docId);
                  setShowSignature(true);
                  // Widget should handle 'flagged' action based on state or prop
                }}
                onViewDetails={(docId) => {
                  setActiveTab('vault');
                  // Optional: we could also auto-select/expand this doc in the vault
                }}
                onView={() => {
                  if (message.documentData?.file_url) {
                    window.open(message.documentData.file_url, '_blank');
                  }
                }}
              />

              <Box
                style={{
                  display: 'flex',
                  justifyContent: position === 'right' ? 'flex-end' : 'flex-start',
                  paddingLeft: '0.25rem',
                  paddingRight: '0.25rem',
                }}
              >
                <Typography style={{ color: '#666' }} variant="caption">
                  {message.timestamp
                    ? dayjs(message.timestamp?.toDate ? message.timestamp.toDate() : message.timestamp).fromNow()
                    : 'Just now'}
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </Box>

        <SignatureWidget
          open={showSignature}
          onClose={() => { setShowSignature(false); setSigningDocId(null); }}
          documentTitle={message.documentData?.title}
          documentDescription={message.documentData?.document_description}
          isLoading={isSigning}
          onSubmit={async (data) => {
            if (!signingDocId) return;
            try {
              // Map frontend action to backend expectation
              const actionMap = {
                accept: 'accepted' as const,
                flag: 'flagged' as const,
                reject: 'rejected' as const
              };

              await signDocument({
                documentId: signingDocId,
                action: actionMap[data.action],
                signature_type: data.signature_type,
                signature_data: data.signature_data,
                flag_reason: data.reason
              }).unwrap();

              setShowSignature(false);
              setSigningDocId(null);
            } catch (error) {
              console.error('Signature submission failed:', error);
            }
          }}
        />
      </>
    );
  }

  return (
    <Box
      style={{
        alignItems: position === 'right' ? 'flex-end' : 'flex-start',
        flex: '0 0 auto',
        display: 'flex',
        marginBottom: '0.5rem',
        width: '100%',
      }}
    >

      <Stack
        direction={position === 'right' ? 'row-reverse' : 'row'}
        spacing={2}
        style={{
          alignItems: 'flex-start',
          maxWidth: '500px',
          marginLeft: position === 'right' ? 'auto' : 0,
          marginRight: position === 'left' ? 'auto' : 0,
          width: '100%',
        }}
      >
        <Avatar
          className="w-8 h-8 text-white text-sm"
          style={{ backgroundColor: avatarBgColor }}
        >
          {generateTextAvatar(displayName)}
        </Avatar>

        <Stack spacing={1} style={{ flex: '1 1 auto' }}>
          <Card
            style={{
              paddingLeft: '0.5rem',
              paddingRight: '0.5rem',
              paddingTop: '0.75rem',
              paddingBottom: '0.75rem',
              borderRadius: '0.5rem',
            }}
            className={`  ${position === 'right' ? 'bg-primary-500!' : 'bg-white'}`}
          >
            <Stack spacing={1}>
              <div>
                <Typography variant="subtitle2" className={`text-sm! cursor-pointer ${position === 'right' ? 'text-white!' : 'text-black'}`}>
                  {`${message?.senderName || message?.sender_display || 'User'}  -  (${message?.senderCompanyName || message?.sender_company_name || 'Platform Admin'})`}
                </Typography>
              </div>

              {/* Handle text messages */}
              <Typography color="inherit" variant="body1" className={`text-sm! ${position === 'right' ? 'text-white!' : 'text-black'}`}>
                {message.text}
              </Typography>
              {/* Handle attachments if they exist */}
              {message.attachments?.length > 0 && (
                <Stack spacing={1} style={{ position: 'relative' }}>
                  {message.attachments.map((attachment: any, index: number) => {
                    const attachmentKey = attachment.url
                      ? `${attachment.url}_${index}`
                      : `deleted_${index}_${attachment.name}`;

                    if (attachment.type === 'deleted') {
                      return (
                        <Card
                          key={attachmentKey}
                          style={{
                            padding: '0.25rem',
                            borderRadius: '0.25rem',
                            backgroundColor: 'rgba(0,0,0,0.05)',
                            border: '1px dashed #f5f5f5',
                          }}
                        >
                          <Stack direction="row" spacing={1} className="items-center">
                            <Typography
                              variant="body2"
                              style={{ color: position === 'right' ? 'inherit' : '#666' }}
                            >
                              <i>Attachment deleted: {attachment.name}</i>
                            </Typography>
                          </Stack>
                        </Card>
                      );
                    }

                    const isImage = attachment.type === 'image' ||
                      (attachment.contentType && attachment.contentType.startsWith('image/')) ||
                      /\.(jpg|jpeg|png|gif|webp|heic|jfif)$/i.test(attachment.name || '');

                    if (isImage) {
                      return (
                        <div key={attachmentKey} className="relative">
                          <img
                            src={attachment.url}
                            alt={attachment.name || 'Image'}
                            className="rounded h-auto max-h-[300px] w-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                            onClick={() => handleMediaClick(attachment)}
                          />
                          {position === 'right' && (
                            <div className="absolute top-1 right-1">
                              <Menu
                                trigger={
                                  <IconButton aria-label="Attachment options" size="sm" variant="default" className="bg-white/80 hover:bg-white border-0 shadow-sm">
                                    <DotsThreeCircleVertical weight="bold" />
                                  </IconButton>
                                }
                              >
                                <MenuItem onClick={() => handleDeleteAttachment(attachment)}>Delete</MenuItem>
                              </Menu>
                            </div>
                          )}
                        </div>
                      );
                    }

                    if (attachment.type === 'video') {
                      return (
                        <div key={attachmentKey} className="relative group">
                          <div
                            className="relative rounded overflow-hidden cursor-pointer bg-black/5"
                            onClick={() => handleMediaClick(attachment)}
                          >
                            <video
                              src={attachment.url}
                              className="w-full h-auto max-h-[300px] object-cover"
                              preload="metadata"
                            />
                            {/* Overlay Play Icon */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                              <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center border border-white/50">
                                <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-white border-b-[8px] border-b-transparent ml-1" />
                              </div>
                            </div>
                            {/* Label */}
                            <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white font-medium backdrop-blur-sm">
                              VIDEO
                            </div>
                          </div>
                          {position === 'right' && (
                            <div className="absolute top-1 right-1">
                              <Menu
                                trigger={
                                  <IconButton aria-label="Attachment options" size="sm" variant="default" className="bg-white/80 hover:bg-white border-0 shadow-sm">
                                    <DotsThreeCircleVertical weight="bold" />
                                  </IconButton>
                                }
                              >
                                <MenuItem onClick={() => handleDeleteAttachment(attachment)}>Delete</MenuItem>
                              </Menu>
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <Card key={attachmentKey} style={{ padding: '0.25rem', borderRadius: '0.25rem' }}>
                        <Stack direction="row" spacing={1} className="items-center">
                          <PaperclipIcon size={16} />
                          <Link href={attachment.url} target="_blank" rel="noopener">
                            {attachment.name || 'Download file'}
                          </Link>
                          <Typography variant="caption">{formatFileSize(attachment.size)}</Typography>
                          {position === 'right' && (
                            <Menu
                              trigger={
                                <IconButton aria-label="Attachment options" size="sm" variant="default">
                                  <DotsThreeCircleVertical weight="bold" />
                                </IconButton>
                              }
                            >
                              <MenuItem onClick={() => handleDeleteAttachment(attachment)}>Delete</MenuItem>
                            </Menu>
                          )}
                        </Stack>
                      </Card>
                    );
                  })}
                </Stack>
              )}
            </Stack>
          </Card>

          {/* Timestamp */}
          <Box
            style={{
              display: 'flex',
              justifyContent: position === 'right' ? 'flex-end' : 'flex-start',
              paddingLeft: '0.25rem',
              paddingRight: '0.25rem',
            }}
          >
            <Typography style={{ color: '#666' }} variant="caption">
              {message.timestamp
                ? dayjs(message.timestamp?.toDate ? message.timestamp.toDate() : message.timestamp).fromNow()
                : 'Just now'}
            </Typography>
            {position === 'right' && renderStatusIndicator()}
          </Box>
        </Stack>
      </Stack>

      {/* Modal for media preview */}
      <Modal
        open={!!selectedMedia}
        onClose={handleCloseModal}
        className="flex items-center justify-center backdrop-blur-md bg-black/60"
      >
        <Box
          style={{
            outline: 'none',
            maxWidth: '90vw',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative'
          }}
        >
          {selectedMedia?.type === 'image' ? (
            <img
              src={selectedMedia.url}
              alt="Preview"
              style={{
                maxHeight: '85vh',
                maxWidth: '100%',
                objectFit: 'contain',
              }}
            />
          ) : (
            <video
              src={selectedMedia?.url}
              controls
              autoPlay
              style={{
                maxHeight: '85vh',
                maxWidth: '100%',
                borderRadius: '8px',
                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
              }}
            />
          )}

          <IconButton
            onClick={handleCloseModal}
            aria-label="Close"
            className="absolute -top-12 right-0 text-white hover:bg-white/20 transition-colors"
          >
            ✕ Close
          </IconButton>
        </Box>
      </Modal>
    </Box>
  );
}
