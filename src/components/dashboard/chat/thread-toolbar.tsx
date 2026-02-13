import * as React from 'react';
import { Avatar } from '@/components/ui/avatar';

import { Box } from '@/components/ui/box';
import { IconButton } from '@/components/ui/icon-button';
import { ListItemIcon } from '@/components/ui/list';
import { Menu } from '@/components/ui/menu';
import { MenuItem } from '@/components/ui/menu';
import { Stack } from '@/components/ui/stack';

import { Typography } from '@/components/ui/typography';
import { Archive as ArchiveIcon } from '@phosphor-icons/react/dist/ssr/Archive';
import { Bell as BellIcon } from '@phosphor-icons/react/dist/ssr/Bell';
import { Camera as CameraIcon } from '@phosphor-icons/react/dist/ssr/Camera';
import { DotsThree as DotsThreeIcon } from '@phosphor-icons/react/dist/ssr/DotsThree';
import { Phone as PhoneIcon } from '@phosphor-icons/react/dist/ssr/Phone';
import { Prohibit as ProhibitIcon } from '@phosphor-icons/react/dist/ssr/Prohibit';
import { Trash as TrashIcon } from '@phosphor-icons/react/dist/ssr/Trash';

import { usePopover } from '@/hooks/use-popover';

import { InvoiceAgreementModal } from '../invoice/invoice_modal';
import { InvoiceAgreementButton } from '../invoice/invoice-agreement-button';
import { generateTextAvatar, stringToColor } from './message-box';

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
              {thread.itemType !== 'business'
                ? `${thread.otherUserName}  -  (${thread.otherCompanyName || 'Individual'})`
                : ''}
            </Typography>
            <Typography noWrap variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              {thread.itemType !== 'business' ? thread.itemTitle : thread.otherUserName}
            </Typography>
          </Box>
        </Stack>
        {/* 
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <IconButton>
            <PhoneIcon />
          </IconButton>
          <IconButton>
            <CameraIcon />
          </IconButton>
          <Tooltip title="More options">
            <IconButton onClick={popover.handleOpen} ref={popover.anchorRef}>
              <DotsThreeIcon weight="bold"  />
            </IconButton>
          </Tooltip>
        </Stack>
         */}
        {thread.itemType !== 'business' && (
          <InvoiceAgreementButton 
            thread={thread} 
            onOpenModal={() => setOpenInvoiceModal(true)} 
            hasExistingInvoice={!!thread.hasExistingInvoice}
          />
        )}
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
