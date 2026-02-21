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
import { ChatContext, Message } from '@/providers/chat-provider';
import dayjs from 'dayjs';
import { useAppSelector } from '@/redux';

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
  const { deleteAttachment, markMessageAsDelivered, markMessageAsRead } = React.useContext(ChatContext);

  // State for modal
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  const params = useParams();
  const threadId = params?.threadId as string;

  const handleImageClick = (attachment: any) => {
    if (attachment.type === 'image') {
      setSelectedImage(attachment.url);
    }
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
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

  // console.log('MessageBox', { message, position });

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

  return (
    <Box
      style={{
        alignItems: position === 'right' ? 'flex-end' : 'flex-start',
        flex: '0 0 auto',
        display: 'flex',
        marginBottom: '0.5rem',
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
              // ...(position === 'right' && {
              //   backgroundColor: '#10b981',
              //   color: 'white',
              // }),
            }}
            className={`  ${position === 'right' ? 'bg-primary-500!' : 'bg-white'}`}
          >
            <Stack spacing={1}>
              <div>
                <Typography variant="subtitle2" className={`cursor-pointer ${position === 'right' ? 'text-white!' : 'text-black'}`}>
                  {/* {`${message?.senderName}  -  (${message?.senderCompanyName})`} */}
                  {`${message?.senderName || message?.sender_display || 'User'}  -  (${message?.senderCompanyName || message?.sender_company_name || 'Platform Admin'})`}
                </Typography>
              </div>

              {/* Handle text messages */}
              <Typography color="inherit" variant="body1" className={`${position === 'right' ? 'text-white!' : 'text-black'}`}>
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

                    if (attachment.type === 'image') {
                      return (
                        <div key={attachmentKey} className="relative">
                          <img
                            src={attachment.url}
                            alt={attachment.name || 'Image'}
                            className="rounded h-auto max-h-[300px] w-full object-cover cursor-pointer"
                            onClick={() => handleImageClick(attachment)}
                          />
                          {position === 'right' && (
                            <div className="absolute top-1 right-1">
                              <Menu
                                trigger={
                                  <IconButton aria-label="Attachment options" size="sm" variant="default">
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

      {/* Modal for image preview */}
      <Modal
        open={!!selectedImage}
        onClose={handleCloseModal}
        className="flex items-center justify-center backdrop-blur-sm"
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
          <img
            src={selectedImage ?? undefined}
            alt="Preview"
            style={{
              maxHeight: '80vh',
              maxWidth: '100%',
              objectFit: 'contain',
            }}
          />
          <IconButton
            onClick={handleCloseModal}
            aria-label="Close"
            className="absolute top-4 right-4 text-white bg-black/50"
          >
            ✕
          </IconButton>
        </Box>
      </Modal>
    </Box>
  );
}
