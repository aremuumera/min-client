import * as React from 'react';
import { Avatar } from '@/components/ui/avatar';

import { Box } from '@/components/ui/box';
import { Stack } from '@/components/ui/stack';

import { Typography } from '@/components/ui/typography';
import { usePopover } from '@/hooks/use-popover';

import { InvoiceAgreementModal } from '../invoice/invoice_modal';
import { InvoiceAgreementButton } from '../invoice/invoice-agreement-button';
import { generateTextAvatar, stringToColor } from '@/utils/chat-utils';

export function ThreadToolbar({ thread }: any) {
  const popover = usePopover();
  const [openInvoiceModal, setOpenInvoiceModal] = React.useState(false);

  const avatarBgColor = stringToColor(thread.otherUserName || 'User');
  console.log('thread in toolbar', thread);

  return (
    <React.Fragment>
      <Stack
        direction="row"
        spacing={2}
        sx={{
          alignItems: 'center',
          borderBottom: '1px solid var(--mui-palette-divider)',
          flex: '0 0 auto',
          justifyContent: 'space-between',
          minHeight: '64px',
          px: 2,
          py: 1,

        }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', minWidth: 0 }}>
          {/* Avatar with generated initials   otherCompanyName */}
          <Avatar
            size="sm"
            style={{
              backgroundColor: avatarBgColor,
              color: 'white',
            }}
          >
            {generateTextAvatar(thread.otherUserName)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap variant="subtitle2">
              {thread.conversationType === 'trade' || thread.itemType === 'trade'
                ? 'Min-meg Trade Desk'
                : thread.itemType !== 'business'
                  ? `${thread.otherUserName}  -  (${thread.otherCompanyName || 'Individual'})`
                  : ''}
            </Typography>
            <Typography noWrap variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              {thread.conversationType === 'trade' || thread.itemType === 'trade'
                ? thread.itemTitle || 'Trade Room'
                : thread.itemType !== 'business' ? thread.itemTitle : thread.otherUserName}
            </Typography>
          </Box>
        </Stack>
        {/* <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <IconButton>
            <PhoneIcon />
          </IconButton>
          <IconButton>
            <CameraIcon />
          </IconButton>
          <Tooltip title="More options">
            <IconButton onClick={popover.handleOpen} ref={popover.anchorRef}>
              <DotsThreeIcon weight="bold" />
            </IconButton>
          </Tooltip>
        </Stack> */}
        {/* {thread.itemType !== 'business' && (
          <InvoiceAgreementButton
            thread={thread}
            onOpenModal={() => setOpenInvoiceModal(true)}
            hasExistingInvoice={!!thread.hasExistingInvoice}
          />
        )} */}
      </Stack>
      {/* <Menu anchorEl={popover.anchorRef.current} onClose={popover.handleClose} open={popover.open}>
        <MenuItem>
          <ListItemIcon>
            <ProhibitIcon />
          </ListItemIcon>
          <Typography>Block</Typography>
        </MenuItem>
        <MenuItem>
          <ListItemIcon>
            <TrashIcon />
          </ListItemIcon>
          <Typography>Delete</Typography>
        </MenuItem>
        <MenuItem>
          <ListItemIcon>
            <ArchiveIcon />
          </ListItemIcon>
          <Typography>Archive</Typography>
        </MenuItem>
        <MenuItem>
          <ListItemIcon>
            <BellIcon />
          </ListItemIcon>
          <Typography>Mute</Typography>
        </MenuItem>
      </Menu> */}
      {/* Invoice Agreement Modal */}
      <InvoiceAgreementModal open={openInvoiceModal} onClose={() => setOpenInvoiceModal(false)} thread={thread} />
    </React.Fragment>
  );
}
