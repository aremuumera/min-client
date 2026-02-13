'use client';

import * as React from 'react';
import {
  Avatar,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Typography,
  Input as OutlinedInput,
  Box
} from '@/components/ui';
import { MagnifyingGlass as MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import { generateTextAvatar, stringToColor } from './message-box';

interface ContactResult {
  id: string;
  itemType: string;
  conversationId: string;
  itemId: string;
  otherUserName: string;
}

interface DirectSearchProps {
  isFocused?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClickAway?: () => void;
  onFocus?: () => void;
  onSelect?: (itemType: string, conversationId: string, itemId: string) => void;
  query?: string;
  results?: ContactResult[];
}

// Simple ClickAwayListener replacement if needed, or just remove for now
const ClickAwayListener = ({ children, onClickAway }: { children: React.ReactNode; onClickAway: () => void }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClickAway();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClickAway]);
  return <div ref={ref}>{children}</div>;
};

// Simple ListItemButton replacement
const ListItemButton = ({ children, onClick, ...props }: { children: React.ReactNode; onClick?: () => void }) => (
  <div
    className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-neutral-50 active:bg-neutral-100 transition-colors"
    onClick={onClick}
    {...props}
  >
    {children}
  </div>
);

export const DirectSearch = React.forwardRef<HTMLDivElement, DirectSearchProps>(function ChatSidebarSearch(
  {
    isFocused,
    onChange,
    onClickAway = () => {
      // noop
    },
    onFocus,
    onSelect,
    query = '',
    results = [],
  },
  ref
) {
  const handleSelect = React.useCallback(
    (itemType: string, conversationId: string, itemId: string) => {
      onSelect?.(itemType, conversationId, itemId);
    },
    [onSelect]
  );

  const showTip = isFocused && !query;
  const showResults = isFocused && query;
  const hasResults = results.length > 0;

  return (
    <ClickAwayListener onClickAway={onClickAway}>
      <Stack ref={ref} spacing={2} tabIndex={-1}>
        <OutlinedInput
          onChange={onChange}
          onFocus={onFocus}
          placeholder="Search users"
          startAdornment={
            <InputAdornment position="start">
              <MagnifyingGlassIcon fontSize="var(--icon-fontSize-md)" />
            </InputAdornment>
          }
          value={query}
        />
        {showTip ? <p className="text-sm text-gray-500 mt-2 ml-2 bg-white p-2 rounded-lg">
          Enter a user name
        </p> : null}
        {showResults ? (
          <React.Fragment>
            {hasResults ? (
              <Stack spacing={1}>
                <Typography color="text.secondary" variant="subtitle2">
                  {results.length} {results.length > 1 ? 'users' : 'user'} found
                </Typography>
                <List disablePadding>
                  {results.map((contact) => (
                    <ListItem disablePadding key={contact.id}>
                      <ListItemButton
                        onClick={() => {
                          handleSelect(contact?.itemType, contact?.conversationId, contact?.itemId);
                        }}
                      >
                        <Avatar
                          style={{
                            backgroundColor: stringToColor(contact?.otherUserName || ''),
                            height: '36px',
                            width: '36px',
                            fontSize: 'var(--fontSize-sm)',
                          }}
                        >
                          {generateTextAvatar(contact?.otherUserName)}
                        </Avatar>
                        <ListItemText
                          primary={
                            <Typography noWrap variant="subtitle2">
                              {contact.otherUserName}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Stack>
            ) : (
              <div>
                <Typography color="text.secondary" variant="body2">
                  We couldn&apos;t find any matches for &quot;{query}&quot;. Try checking for typos or using complete
                  words.
                </Typography>
              </div>
            )}
          </React.Fragment>
        ) : null}
      </Stack>
    </ClickAwayListener>
  );
});

DirectSearch.displayName = 'DirectSearch';
