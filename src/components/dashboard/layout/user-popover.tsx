'use client';

import * as React from 'react';
import { logout } from '@/redux/features/AuthFeature/auth_slice';
import { resetRFQState } from '@/redux/features/buyer-rfq/rfq-slice';
import { resetProductState } from '@/redux/features/supplier-products/products_slice';
import { paths } from '@/config/paths';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Box } from '@/components/ui/box';
import { Divider } from '@/components/ui/divider';
import { List, ListItemIcon } from '@/components/ui/list';
import { MenuItem } from '@/components/ui/menu';
import { Popover } from '@/components/ui/popover';
import { Typography } from '@/components/ui/typography';
import { CreditCard as CreditCardIcon } from '@phosphor-icons/react/dist/ssr/CreditCard';
import { EnvelopeSimple as EnvelopeIcon } from '@phosphor-icons/react/dist/ssr/EnvelopeSimple';
import { IdentificationBadge as RoleIcon } from '@phosphor-icons/react/dist/ssr/IdentificationBadge';
import { LockKey as LockKeyIcon } from '@phosphor-icons/react/dist/ssr/LockKey';
import { User as UserIcon } from '@phosphor-icons/react/dist/ssr/User';
import { IoIosLogOut } from 'react-icons/io';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';

import { RouterLink } from '@/components/core/link';
import { cn } from '@/utils/helper';
import { useMediaQuery } from '@/hooks/use-media-query';

interface UserPopoverProps {
    trigger: React.ReactNode;
    onClose?: () => void;
    open?: boolean;
    anchorEl?: any;
}

export function UserPopover({ trigger, onClose, open }: UserPopoverProps) {
    const { appData, user } = useSelector((state: any) => state?.auth);

    const isBusinessVerified = appData?.businessVerification?.isVerified;
    const isSupplierProfileCreated = appData?.isProfileCreated;
    const userRole = user?.role;

    const finalRelease = isBusinessVerified && (userRole !== 'supplier' || isSupplierProfileCreated);

    const dispatch = useDispatch();
    const router = useRouter();

    // Generate initials for avatar if no image available
    const getInitials = () => {
        return user?.firstName && user?.lastName ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : 'U';
    };

    const handleLogout = () => {
        dispatch(logout());
        dispatch(resetProductState());
        dispatch(resetRFQState());
        router.replace(paths.home);
    };

    const isMobile = useMediaQuery('down', 'sm');

    return (
        <Popover
            trigger={trigger}
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) onClose?.();
            }}
            className={cn(
                "w-[calc(100vw-32px)] sm:w-[320px]",
                isMobile && "fixed left-4 right-4 top-20 translate-x-0! right-auto!"
            )}
            position="bottom"
            align={isMobile ? 'center' : 'end'}
        >
            <Box className="p-6 flex items-center bg-neutral-50 border-b border-neutral-200">
                <Avatar
                    style={{
                        width: 56,
                        height: 56,
                        backgroundColor: 'var(--mui-palette-primary-main)',
                        color: 'white',
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    }}
                    src={user?.avatar || '/profile.svg'}
                >
                    {getInitials()}
                </Avatar>
                <Box className="ml-4 overflow-hidden">
                    <Typography
                        variant="h6"
                        className="font-semibold leading-tight whitespace-nowrap overflow-hidden text-ellipsis"
                    >
                        {user?.firstName} {user?.lastName}
                    </Typography>

                    <Box className="flex items-center mt-1">
                        <RoleIcon size={14} weight="bold" className="text-neutral-500" />
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            className="ml-1 font-medium capitalize text-neutral-500"
                        >
                            {user?.role || 'User'}
                        </Typography>
                    </Box>

                    <Box className="flex items-center mt-1">
                        <EnvelopeIcon size={14} weight="bold" className="text-neutral-500" />
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            className="ml-1 whitespace-nowrap overflow-hidden text-ellipsis text-neutral-500"
                        >
                            {user?.email}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {finalRelease && (
                <>
                    <List className="p-1">
                        <MenuItem as={RouterLink} href={paths.dashboard.settings.account} onClick={onClose}>
                            <ListItemIcon>
                                <UserIcon />
                            </ListItemIcon>
                            Account
                        </MenuItem>
                        <MenuItem as={RouterLink} href={paths.dashboard.settings.security} onClick={onClose}>
                            <ListItemIcon>
                                <LockKeyIcon />
                            </ListItemIcon>
                            Security
                        </MenuItem>
                    </List>
                    <Divider />
                </>
            )}

            <Box className="p-4 flex justify-center">
                <Button
                    onClick={handleLogout}
                    variant="contained"
                    className="w-full py-2 font-semibold normal-case rounded-lg"
                >
                    <IoIosLogOut className="mr-2 text-xl" /> Sign Out
                </Button>
            </Box>
        </Popover>
    );
}
